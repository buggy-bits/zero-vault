import { Router } from "express";
import { greetByName } from "../controllers/test.controller";

const router = Router();
// /api/v1/health
router.get("/", greetByName);

export default router;
