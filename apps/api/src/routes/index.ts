import { Router } from "express";
import healthRoutes from "./health.route";
import authRoutes from "./auth.route";
import oAuthRoutes from "./oauth.route";
import usersRoute from "./user.route";
import notesRoute from "./note.route";
import fileRoute from "./file.route";
import shareRoute from "./share.route";
import { verifyToken } from "../middlewares/token.middleware";

const router = Router();
//   /api/v1
router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/oauth", oAuthRoutes);
router.use("/notes", notesRoute);
router.use("/user", usersRoute);
router.use("/share", shareRoute);
router.use("/files", verifyToken, fileRoute);

export default router;
