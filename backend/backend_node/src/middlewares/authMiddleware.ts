import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extend the Request interface to include 'user'
// This lets us access req.user in our controllers later
interface AuthRequest extends Request {
  user?: any;
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
  // 1. Get the token from the header (Authorization: Bearer <token>)
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Split "Bearer TOKEN"

  if (!token) {
    res.status(401).json({ message: 'Access Denied: No Token Provided' });
    return;
  }

  // 2. Verify the token
  jwt.verify(token, process.env.JWT_SECRET as string, (err, user) => {
    if (err) {
      res.status(403).json({ message: 'Invalid Token' });
      return;
    }

    // 3. Attach user info to request and move on
    req.user = user;
    next();
  });
};