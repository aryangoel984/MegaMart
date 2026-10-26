import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../config/db';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const registerSchema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
  name: z.string().trim().min(1).optional(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Za-z]/, 'Password must include a letter')
    .regex(/[0-9]/, 'Password must include a number'),
});

// 1. Register logic
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(422).json({ message: parsed.error.issues[0]?.message || 'Invalid registration details' });
      return;
    }
    const { email, password, name } = parsed.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      // 409 Conflict, not 400 — the request itself was well-formed, it
      // just conflicts with existing state.
      res.status(409).json({ message: 'An account with this email already exists' });
      return;
    }

    // Hash the password (Security Best Practice)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save to DB
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
      },
    });

    res.status(201).json({ message: 'User created successfully', userId: user.id });
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong', error });
  }
};

// 2. Login logic
export const login = async (req: Request, res: Response): Promise<void> => {
  try{
    const { email, password } = req.body;
    if (typeof email !== 'string' || typeof password !== 'string') {
      res.status(422).json({ message: 'Email and password are required' });
      return;
    }
    // Find User
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Same generic message as a wrong password, so login never reveals
      // whether an email is registered.
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }
    // Check Password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      res.status(500).json({ message: 'Server misconfigured: JWT_SECRET is missing' });
      return;
    }

    // Generate JWT Token (The "ID Card")
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      jwtSecret,
      { expiresIn: '1h' }
    );
    res.json({ token, userId: user.id, name: user.name });

  } catch(error){
        res.status(500).json({ message: 'Something went wrong', error });
    }
};

