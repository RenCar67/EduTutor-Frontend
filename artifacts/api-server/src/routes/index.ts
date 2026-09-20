import { Router, type IRouter } from "express";
import healthRouter from "./health";
import edututorRouter from "./edututor";

const router: IRouter = Router();

router.use(healthRouter);
router.use(edututorRouter);

export default router;
