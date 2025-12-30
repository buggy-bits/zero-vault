import mongoose, { Document } from "mongoose";

export interface UserType extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  userName: string;
  password: string;
  projects: mongoose.Types.ObjectId[];
  createdAt: Date;
}
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  userName: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },

  projects: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
    },
  ],

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const UserModel = mongoose.model<UserType>("Users", userSchema);
export default UserModel;
