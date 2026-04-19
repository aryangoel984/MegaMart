"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.register = void 0;
const db_1 = __importDefault(require("../config/db"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// 1. Register logic
const register = async (req, res) => {
    try {
        const { email, password, name } = req.body;
        // Check if user already exists
        const existingUser = await db_1.default.user.findUnique({ where: { email } });
        if (existingUser) {
            res.status(400).json({ message: 'User already exists' });
            return;
        }
        // Hash the password (Security Best Practice)
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        // Save to DB
        const user = await db_1.default.user.create({
            data: {
                email,
                name,
                password: hashedPassword,
            },
        });
        res.status(201).json({ message: 'User created successfully', userId: user.id });
    }
    catch (error) {
        res.status(500).json({ message: 'Something went wrong', error });
    }
};
exports.register = register;
// 2. Login logic
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        // Find User
        const user = await db_1.default.user.findUnique({ where: { email } });
        if (!user) {
            res.status(400).json({ message: 'Invalid credentials' });
            return;
        }
        // Check Password
        const isMatch = await bcrypt_1.default.compare(password, user.password);
        if (!isMatch) {
            res.status(400).json({ message: 'Invalid credentials' });
            return;
        }
        // Generate JWT Token (The "ID Card")
        const token = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET || 'supersecretkey', // We will add this to .env later
        { expiresIn: '1h' });
        res.json({ token, userId: user.id, name: user.name });
    }
    catch (error) {
        res.status(500).json({ message: 'Something went wrong', error });
    }
};
exports.login = login;
