import { Router, type IRouter } from "express";
import { db, doctorsTable } from "@workspace/db";
import { CreateDoctorBody, ListDoctorsResponse, CreateDoctorResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/doctors", async (req, res): Promise<void> => {
  const doctors = await db.select().from(doctorsTable).orderBy(doctorsTable.name);
  res.json(ListDoctorsResponse.parse(doctors));
});

router.post("/doctors", async (req, res): Promise<void> => {
  const parsed = CreateDoctorBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid doctor input");
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [doctor] = await db.insert(doctorsTable).values(parsed.data).returning();
  res.status(201).json(CreateDoctorResponse.parse(doctor));
});

export default router;
