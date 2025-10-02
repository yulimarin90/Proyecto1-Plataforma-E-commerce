import { Request, Response, NextFunction } from "express";
import { JwtPayload } from "jsonwebtoken";
export interface AuthRequest extends Request {
    user?: JwtPayload | string;
}
export default function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): Response<any, Record<string, any>> | undefined;
//# sourceMappingURL=auth.middlewares.d.ts.map