import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

export interface RequestWithId extends Request {
  id?: string;
}

/** Tags every request with a short id, echoed back as X-Request-Id, so a
 * single request can be traced through logs (and quoted back by a user
 * reporting an error) instead of guessing which log line matches which call. */
export const requestId = (req: RequestWithId, res: Response, next: NextFunction): void => {
  const id = randomUUID().slice(0, 8);
  req.id = id;
  res.setHeader('X-Request-Id', id);
  next();
};
