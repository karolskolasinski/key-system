import { Schema } from "mongoose";
import mongoose from "mongoose";

interface IUser extends Document {
  email: string;
  password: string;
  refresh_token?: string;
}

const UserSchema: Schema = new Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  refresh_token: { type: String },
});

export default mongoose.model<IUser>("User", UserSchema);
