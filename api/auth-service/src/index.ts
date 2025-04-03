import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { getErrorMsg } from "./utils";
import User from "./model";
import { connectDb } from "./db";
import cors from "cors";
import cookieParser from "cookie-parser";

dotenv.config();

const PORT = process.env.EXPRESS_PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;
const app = express();
app.use(cors({
  origin: "http://localhost:7777",
  credentials: true,
}));
app.use(cookieParser());

connectDb();

app.use(bodyParser.json());

app.post("/register", async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const savedUser = await User.create({
      email,
      password: hashedPassword,
    });

    res.status(201).json({ id: savedUser._id });
  } catch (err) {
    res.status(400).json({ error: getErrorMsg(err) });
  }
});

app.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined");
  }

  try {
    const user = await User.findOne({ email });

    if (!user || user?.password === null) {
      res.status(400).json({ error: "InvalidCredentials" });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      res.status(400).json({ error: "InvalidCredentials" });
      return;
    }

    const payload = { id: user._id, email: user.email };
    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });
    user.refresh_token = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
    await user.save();

    res.cookie("accessToken", accessToken, { httpOnly: true, sameSite: "none", secure: true });
    res.status(200).json({ message: "LoginSuccess" });
  } catch (err) {
    res.status(500).json({ error: getErrorMsg(err) });
  }
});

app.post("/refresh", async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined");
  }

  if (!refreshToken) {
    res.status(400).json({ error: "RefreshTokenRequired" });
    return;
  }

  try {
    const decoded = jwt.verify(refreshToken, JWT_SECRET) as any;
    console.log(decoded, "<><<<<<<<<<<<<<<");

    const user = await User.findOne({ _id: decoded.id, refresh_token: refreshToken });
    if (!user) {
      res.status(401).json({ error: "InvalidRefreshToken" });
      return;
    }

    const payload = { id: user._id, email: user.email };
    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });
    const newRefreshToken = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });

    user.refresh_token = newRefreshToken;
    await user.save();

    res.status(200).json({ accessToken, refreshToken: newRefreshToken });
  } catch (err) {
    if (err instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: "InvalidRefreshToken" });
      return;
    }

    res.status(500).json({ error: getErrorMsg(err) });
  }
});

app.post("/refresh", async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined");
  }

  if (!refreshToken) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const user = await User.findOne({ refresh_token: refreshToken });

    if (!user) {
      res.status(403).json({ error: "InvalidRefreshToken" });
      return;
    }

    jwt.verify(refreshToken, JWT_SECRET, (err: unknown, decoded: unknown) => {
      if (err) {
        res.status(403).json({ error: "InvalidToken" });
        return;
      }

      console.log(decoded, "<<<<<<<<<<<<<<<<<<<<<<<<<<<DDDD");

      // const payload = decoded as { id: string; email: string };
      const payload = { id: user._id, email: user.email };
      const newAccessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });

      res.json({ accessToken: newAccessToken });
    });
  } catch (err) {
    res.status(500).json({ error: getErrorMsg(err) });
  }
});

app.put("/change-password", async (req: Request, res: Response) => {
  const { email, oldPassword, newPassword } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      res.status(400).json({ error: "userNotFound" });
      return;
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      res.status(400).json({ error: "incorrectOldPassword" });
      return;
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.status(200).json({ message: "passwordChangedSuccessfully" });
  } catch (err) {
    res.status(500).json({ error: getErrorMsg(err) });
  }
});

app.put("/change-email", async (req: Request, res: Response) => {
  const { oldEmail, newEmail, password } = req.body;

  try {
    const user = await User.findOne({ email: oldEmail });

    if (!user) {
      res.status(400).json({ error: "userNotFound" });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(400).json({ error: "incorrectPassword" });
      return;
    }

    const emailExists = await User.findOne({ email: newEmail });
    if (emailExists) {
      res.status(400).json({ error: "emailAlreadyInUse" });
      return;
    }

    user.email = newEmail;
    await user.save();

    res.status(200).json({ message: "emailChangedSuccessfully" });
  } catch (err) {
    res.status(500).json({ error: getErrorMsg(err) });
  }
});

app.post("/logout", async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  try {
    await User.updateOne({ refresh_token: refreshToken }, { $unset: { refresh_token: "" } });
    res.status(200).json({ message: "LoggedOut" });
  } catch (err) {
    res.status(500).json({ error: getErrorMsg(err) });
  }
});

app.get("/users/:id", async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id).select("email");

    if (!user) {
      res.status(404).json({ error: "UserNotFound" });
      return;
    }

    res.status(200).json([{ id: user._id, email: user.email }]);
  } catch (err) {
    res.status(500).json({ error: getErrorMsg(err) });
  }
});

app.listen(PORT, () => {
  console.info(`server running on port ${PORT}`);
});
