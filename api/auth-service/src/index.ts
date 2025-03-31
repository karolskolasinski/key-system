import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import pool from "./db";
import createTable from "./initDb";

dotenv.config();

const app = express();
app.use(bodyParser.json());

createTable();

app.get("/", (req: Request, res: Response) => {
  res.send("Hello World");
});

app.post("/register", async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const query = "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING *";
    const result = await pool.query(query, [email, hashedPassword]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: "Użytkownik o takim emailu już istnieje." });
  }
});

app.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const query = "SELECT * FROM users WHERE email = $1";
    const result = await pool.query(query, [email]);
    if (result.rows.length === 0) {
      res.status(400).json({ error: "Nieprawidłowy email lub hasło." });
    }
    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(400).json({ error: "Nieprawidłowy email lub hasło." });
    }
    res.status(200).json({ message: "Zalogowano pomyślnie." });
  } catch (err) {
    res.status(400).json({ error: "Nieprawidłowy email lub hasło." });
  }
});

app.put("/change-password", async (req: Request, res: Response) => {
  const { email, oldPassword, newPassword } = req.body;
  const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
  if (result.rows.length === 0) {
    res.status(400).json({ error: "Użytkownik nie znaleziony." });
  }
  const user = result.rows[0];
  const isMatch = await bcrypt.compare(oldPassword, user.password);
  if (!isMatch) {
    res.status(400).json({ error: "Stare hasło jest nieprawidłowe." });
  }
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await pool.query("UPDATE users SET password = $1 WHERE email = $2", [hashedPassword, email]);
  res.status(200).json({ message: "Hasło zostało zmienione." });
});

app.put("/change-email", async (req: Request, res: Response) => {
  const { oldEmail, newEmail, password } = req.body;
  const result = await pool.query("SELECT * FROM users WHERE email = $1", [oldEmail]);
  if (result.rows.length === 0) {
    res.status(400).json({ error: "Użytkownik nie znaleziony." });
  }
  const user = result.rows[0];
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    res.status(400).json({ error: "Hasło jest nieprawidłowe." });
  }
  try {
    await pool.query("UPDATE users SET email = $1 WHERE email = $2", [newEmail, oldEmail]);
    res.status(200).json({ message: "Email został zmieniony." });
  } catch (err) {
    res.status(400).json({ error: "Nowy email jest już używany." });
  }
});

const PORT = process.env.EXPRESS_PORT || 3000;
app.listen(PORT, () => {
  console.info(`server running on port ${PORT}`);
});
