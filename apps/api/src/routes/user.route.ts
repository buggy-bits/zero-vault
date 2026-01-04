import { Router } from "express";
import { verifyToken } from "../middlewares/token.middleware";
import { getSinglUser } from "../controllers/user.controller";
import UserModel from "../models/user.model";

const router = Router();

router.get("/me", verifyToken, getSinglUser);

router.get("/public-key", verifyToken, async (req, res) => {
  const { email } = req.query;

  const user = await UserModel.findOne({ email });
  if (!user) return res.status(404).json({ message: "User not found" });

  res.json({
    userId: user._id,
    publicKey: user.publicKey,
  });
});
export default router;
