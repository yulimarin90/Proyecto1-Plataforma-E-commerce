import { Request, Response, NextFunction } from "express";
import { AuthService } from "../../Authentication/auth.service";

export const verifyAuthToken = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader) return res.status(401).json({ message: "No token provided" });

    const token = authHeader.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Invalid token format" });

    const decoded = AuthService.verifyAccessToken(token);
    (req as any).user = decoded; 
    next();
  } catch (error: any) {
    return res.status(403).json({ message: "Token inválido o expirado" });
  }
};
