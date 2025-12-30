import { Router } from "express";
import healthRoutes from "./health.route";
import authRoutes from "./auth.route";
import usersRoute from "./user.route";
import { verifyToken } from "../middlewares/token.middleware";

const router = Router();
//          /api/v1
router.use("/health", healthRoutes);
router.use("/auth", authRoutes);

router.use("/user", usersRoute);

export default router;
