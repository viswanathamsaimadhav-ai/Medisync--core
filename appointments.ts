import { Router, type IRouter } from "express";
import { eq, and, asc, desc, gt, lte, count } from "drizzle-orm";
import { db, appointmentsTable, doctorsTable } from "@workspace/db";
import {
  CreateAppointmentBody,
  DeleteAppointmentParams,
  ListAppointmentsResponse,
  CreateAppointmentResponse,
  GetAppointmentSummaryResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

// GET /appointments - list all appointments with doctor details (ordered by time)
router.get("/appointments", async (req, res): Promise<void> => {
  const rows = await db
    .select({
      id: appointmentsTable.id,
      patientName: appointmentsTable.patientName,
      doctorId: appointmentsTable.doctorId,
      startTime: appointmentsTable.startTime,
      doctor: {
        id: doctorsTable.id,
        name: doctorsTable.name,
        specialization: doctorsTable.specialization,
      },
    })
    .from(appointmentsTable)
    .innerJoin(doctorsTable, eq(appointmentsTable.doctorId, doctorsTable.id))
    .orderBy(asc(appointmentsTable.startTime));

  const mapped = rows.map((r) => ({
    ...r,
    startTime: r.startTime.toISOString(),
  }));

  res.json(ListAppointmentsResponse.parse(mapped));
});

// POST /appointments - book an appointment (with conflict check)
router.post("/appointments", async (req, res): Promise<void> => {
  const parsed = CreateAppointmentBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid appointment input");
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { patientName, doctorId, startTime } = parsed.data;
  const requestedTime = new Date(startTime);

  // Conflict check: doctor already has an appointment at exactly this time
  const conflicts = await db
    .select({ id: appointmentsTable.id })
    .from(appointmentsTable)
    .where(
      and(
        eq(appointmentsTable.doctorId, doctorId),
        eq(appointmentsTable.startTime, requestedTime),
      ),
    );

  if (conflicts.length > 0) {
    req.log.info({ doctorId, startTime }, "Booking conflict detected");
    res.status(409).json({ error: "Conflict: Doctor is already booked at that time." });
    return;
  }

  // Doctor must exist
  const [doctor] = await db.select().from(doctorsTable).where(eq(doctorsTable.id, doctorId));
  if (!doctor) {
    res.status(400).json({ error: "Doctor not found." });
    return;
  }

  let appointment: typeof appointmentsTable.$inferSelect;
  try {
    const [inserted] = await db
      .insert(appointmentsTable)
      .values({ patientName, doctorId, startTime: requestedTime })
      .returning();
    appointment = inserted;
  } catch (err: unknown) {
    // Unique constraint violation — concurrent booking for same doctor/time
    if (
      err instanceof Error &&
      "code" in err &&
      (err as { code: string }).code === "23505"
    ) {
      req.log.info({ doctorId, startTime }, "Concurrent booking conflict caught at DB level");
      res.status(409).json({ error: "Conflict: Doctor is already booked at that time." });
      return;
    }
    throw err;
  }

  const result = {
    id: appointment.id,
    patientName: appointment.patientName,
    doctorId: appointment.doctorId,
    startTime: appointment.startTime.toISOString(),
    doctor: {
      id: doctor.id,
      name: doctor.name,
      specialization: doctor.specialization,
    },
  };

  res.status(201).json(CreateAppointmentResponse.parse(result));
});

// DELETE /appointments/:id - cancel appointment
router.delete("/appointments/:id", async (req, res): Promise<void> => {
  const params = DeleteAppointmentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(appointmentsTable)
    .where(eq(appointmentsTable.id, params.data.id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Appointment not found." });
    return;
  }

  res.sendStatus(204);
});

// GET /appointments/summary - summary stats
router.get("/appointments/summary", async (req, res): Promise<void> => {
  const now = new Date();

  const [totalRow] = await db
    .select({ value: count() })
    .from(appointmentsTable);

  const [upcomingRow] = await db
    .select({ value: count() })
    .from(appointmentsTable)
    .where(gt(appointmentsTable.startTime, now));

  const [pastRow] = await db
    .select({ value: count() })
    .from(appointmentsTable)
    .where(lte(appointmentsTable.startTime, now));

  const byDoctorRows = await db
    .select({
      doctorId: doctorsTable.id,
      doctorName: doctorsTable.name,
      specialization: doctorsTable.specialization,
      count: count(appointmentsTable.id),
    })
    .from(doctorsTable)
    .leftJoin(appointmentsTable, eq(appointmentsTable.doctorId, doctorsTable.id))
    .groupBy(doctorsTable.id, doctorsTable.name, doctorsTable.specialization)
    .orderBy(desc(count(appointmentsTable.id)));

  res.json(
    GetAppointmentSummaryResponse.parse({
      total: totalRow?.value ?? 0,
      upcoming: upcomingRow?.value ?? 0,
      past: pastRow?.value ?? 0,
      byDoctor: byDoctorRows,
    }),
  );
});

export default router;
