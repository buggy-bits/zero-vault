import { NextFunction, Request, Response } from "express";
import { AppError } from "../middlewares/errorHandler.middleware";
import UserModel, { UserType } from "../models/user.model";
import bcrypt from "bcrypt";
import {
  generateAccessToken,
  generateRefreshToken,
  TokenPayload,
} from "../utils/token";
import jwt from "jsonwebtoken";
import { GUEST_USER_EMAIL, JWT_REFRESH_TOKEN_SECRET } from "../config/env";
import { accessCookie, refreshCookie } from "../config/cookies";
const saltRounds = 10;

export const registerUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      email,
      password,
      publicKey,
      encryptedPrivateKey,
      //  userName
    } = req.body;

    if (!email || !password) {
      const error: AppError = new Error(
        "Email, Username and Password are required"
      );
      error.status = 400;
      throw error;
    }
    // check for user existance
    UserModel.findOne({ $or: [{ email }] }).then((existingUser) => {
      // if user already exists
      if (existingUser) {
        const error: AppError = new Error(
          "User with given email or username already exists"
        );
        error.status = 409; // conflict
        next(error);
      }
      // hash given password
      bcrypt.genSalt(saltRounds, function (err, salt) {
        bcrypt.hash(password, salt, function (err, hash) {
          const newUser = new UserModel({
            email,
            // userName,
            passwordHash: hash,

            publicKey,
            encryptedPrivateKey,
          });
          // save user to database
          newUser
            .save()
            .then(() => {
              // const accessToken = generateAccessToken({
              //   userId: newUser._id.toString(),
              // });
              // const refreshToken = generateRefreshToken({
              //   userId: newUser._id.toString(),
              // });

              // res.cookie("refreshToken", refreshToken, {
              //   httpOnly: true,
              //   secure: true,
              //   sameSite: "strict",
              // });

              // return success response
              res.status(201).json({
                status: "success",
                message: "User registered successfully.",
                // data: { userId: newUser._id, email },
                // accessToken,
              });
            })
            .catch((error) => {
              // or error response
              const err: AppError = new Error(
                "Database error: unable to save user"
              );
              err.status = 500;
              next(error);
              return;
            });
        });
      });
    });
  } catch (error) {
    next(error);
  }
};

export const loginUser = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      const error: AppError = new Error("Email and Password are required");
      error.status = 400;
      throw error;
    }
    // check for user existance
    UserModel.findOne({ email }).then((existingUser: UserType | null) => {
      if (!existingUser) {
        const error: AppError = new Error("Invalid email or password");
        error.status = 401;
        return next(error);
      }
      // compare the password
      bcrypt.compare(password, existingUser.passwordHash, function (
        err,
        result
      ) {
        if (!result) {
          // incorrect password
          const error: AppError = new Error("Invalid email or password");
          error.status = 403;
          return next(error);
        }
        // correct
        const accessToken = generateAccessToken({
          userId: existingUser._id.toString(),
          email: existingUser.email,
        });

        const refreshToken = generateRefreshToken({
          userId: existingUser._id.toString(),
          email: existingUser.email,
        });

        res.cookie("refreshToken", refreshToken, refreshCookie);

        res.cookie("accessToken", accessToken, accessCookie);

        res.status(200).json({
          status: "success",
          message: "User login successfull",
          data: {
            userId: existingUser._id,
            email,
            // userName: existingUser.userName,
          },
          publicKey: existingUser.publicKey,
          encryptedPrivateKey: existingUser.encryptedPrivateKey,
        });
      });
    });
  } catch (error) {
    next(error);
    return;
  }
};

export const generateNewAccessToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.cookies?.refreshToken;

    if (!token) {
      const error: AppError = new Error("Refresh token missing");
      error.status = 401;
      return next(error);
    }

    const payload = jwt.verify(
      token,
      JWT_REFRESH_TOKEN_SECRET || "i-am-key"
    ) as TokenPayload;

    const newAccessToken = generateAccessToken({
      userId: payload.userId,
      email: payload.email,
    });

    const newRefreshToken = generateRefreshToken({
      userId: payload.userId,
      email: payload.email,
    });

    res
      .cookie("accessToken", newAccessToken, accessCookie)
      .cookie("refreshToken", newRefreshToken, refreshCookie)
      .status(200)
      .json({
        status: "success",
        message: "New access token generated",
      });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      const jwtError: AppError = new Error("Invalid refresh token");
      jwtError.status = 401;
      return next(jwtError);
    } else if (error instanceof jwt.TokenExpiredError) {
      const expiredError: AppError = new Error("Refresh token expired");
      expiredError.status = 401;
      return next(expiredError);
    }
    return next(error); // Handle other errors
  }
};

export const loginGuestUser = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const email = GUEST_USER_EMAIL;
    UserModel.findOne({ email }).then((existingUser) => {
      if (!existingUser) {
        const error: AppError = new Error("Invalid email or password");
        error.status = 401;
        return next(error);
      }
      const accessToken = generateAccessToken({
        userId: existingUser._id.toString(),
        email: existingUser.email,
      });
      const refreshToken = generateRefreshToken({
        userId: existingUser._id.toString(),
        email: existingUser.email,
      });
      res.cookie("refreshToken", refreshToken, refreshCookie);

      res.cookie("accessToken", accessToken, accessCookie);

      res.status(200).json({
        status: "success",
        message: "User logged in successfully",
        data: {
          userId: existingUser._id,
          email,
          // userName: existingUser.userName,
        },
      });
    });
  } catch (error) {
    next(error);
    return;
  }
};

export const logoutUser = (req: Request, res: Response, next: NextFunction) => {
  try {
    res
      .clearCookie("accessToken", accessCookie)
      .clearCookie("refreshToken", refreshCookie)
      .status(200)
      .json({
        status: "success",
        message: "User logged out successfully",
      });
  } catch (error) {
    next(error);
    return;
  }
};
