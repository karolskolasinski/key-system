"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = __importDefault(require("./db"));
const initDb_1 = __importDefault(require("./initDb"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use(body_parser_1.default.json());
(0, initDb_1.default)();
app.post("/register", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    const hashedPassword = yield bcryptjs_1.default.hash(password, 10);
    try {
        const query = "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING *";
        const result = yield db_1.default.query(query, [email, hashedPassword]);
        res.status(201).json(result.rows[0]);
    }
    catch (err) {
        res.status(400).json({ error: "Użytkownik o takim emailu już istnieje." });
    }
}));
app.post("/login", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    try {
        const query = "SELECT * FROM users WHERE email = $1";
        const result = yield db_1.default.query(query, [email]);
        if (result.rows.length === 0) {
            res.status(400).json({ error: "Nieprawidłowy email lub hasło." });
        }
        const user = result.rows[0];
        const isMatch = yield bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            res.status(400).json({ error: "Nieprawidłowy email lub hasło." });
        }
        res.status(200).json({ message: "Zalogowano pomyślnie." });
    }
    catch (err) {
        res.status(400).json({ error: "Nieprawidłowy email lub hasło." });
    }
}));
app.put("/change-password", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, oldPassword, newPassword } = req.body;
    const result = yield db_1.default.query("SELECT * FROM users WHERE email = $1", [email]);
    if (result.rows.length === 0) {
        res.status(400).json({ error: "Użytkownik nie znaleziony." });
    }
    const user = result.rows[0];
    const isMatch = yield bcryptjs_1.default.compare(oldPassword, user.password);
    if (!isMatch) {
        res.status(400).json({ error: "Stare hasło jest nieprawidłowe." });
    }
    const hashedPassword = yield bcryptjs_1.default.hash(newPassword, 10);
    yield db_1.default.query("UPDATE users SET password = $1 WHERE email = $2", [hashedPassword, email]);
    res.status(200).json({ message: "Hasło zostało zmienione." });
}));
app.put("/change-email", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { oldEmail, newEmail, password } = req.body;
    const result = yield db_1.default.query("SELECT * FROM users WHERE email = $1", [oldEmail]);
    if (result.rows.length === 0) {
        res.status(400).json({ error: "Użytkownik nie znaleziony." });
    }
    const user = result.rows[0];
    const isMatch = yield bcryptjs_1.default.compare(password, user.password);
    if (!isMatch) {
        res.status(400).json({ error: "Hasło jest nieprawidłowe." });
    }
    try {
        yield db_1.default.query("UPDATE users SET email = $1 WHERE email = $2", [newEmail, oldEmail]);
        res.status(200).json({ message: "Email został zmieniony." });
    }
    catch (err) {
        res.status(400).json({ error: "Nowy email jest już używany." });
    }
}));
const PORT = process.env.EXPRESS_PORT || 3000;
app.listen(PORT, () => {
    console.info(`server running on port ${PORT}`);
});
