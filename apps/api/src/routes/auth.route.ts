import { Router } from "express";
import {
  loginUser,
  generateNewAccessToken,
  registerUser,
  loginGuestUser,
  logoutUser,
} from "../controllers/auth.controller";
import { verifyToken } from "../middlewares/token.middleware";
import { extractUser } from "../controllers/user.controller";

const router = Router();
//  /api/v1/auth

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/iamguest", loginGuestUser);
router.post("/token/refresh", generateNewAccessToken);
router.post("/logout", verifyToken, logoutUser);
router.get("/me", verifyToken, extractUser);
export default router;
