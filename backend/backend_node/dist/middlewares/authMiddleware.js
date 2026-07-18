"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authenticateToken = (req, res, next) => {
    // 1. Get the token from the header (Authorization: Bearer <token>)
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Split "Bearer TOKEN"
    if (!token) {
        res.status(401).json({ message: 'Access Denied: No Token Provided' });
        return;
    }
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        res.status(500).json({ message: 'Server misconfigured: JWT_SECRET is missing' });
        return;
    }
    // 2. Verify the token
    jsonwebtoken_1.default.verify(token, jwtSecret, (err, user) => {
        if (err) {
            res.status(403).json({ message: 'Invalid Token' });
            return;
        }
        // 3. Attach user info to request and move on
        req.user = user;
        next();
    });
};
exports.authenticateToken = authenticateToken;
