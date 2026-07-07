import { Router, type IRouter } from "express";
import healthRouter from "./health";
import doctorsRouter from "./doctors";
import appointmentsRouter from "./appointments";

const router: IRouter = Router();

router.use(healthRouter);
router.use(doctorsRouter);
router.use(appointmentsRouter);

export default router;
