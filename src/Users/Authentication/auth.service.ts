import jwt from "jsonwebtoken";

export class AuthService {
  /** Generar Access Token (corto plazo) */
  static generateAccessToken(payload: object): string {
    console.log("🔑 JWT_SECRET:", process.env.JWT_SECRET);
    console.log("🔑 JWT_REFRESH_SECRET:", process.env.JWT_REFRESH_SECRET);

    return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: "15m" });
  }

  /** Generar Refresh Token (largo plazo) */
  static generateRefreshToken(payload: object): string {
    return jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, { expiresIn: "7d" });
  }

  /** Verificar Access Token con manejo de errores */
  static verifyAccessToken(token: string): any {
    try {
      return jwt.verify(token, process.env.JWT_SECRET!);
    } catch (err) {
      throw { status: 401, message: "Access token inválido o expirado" };
    }
  }

  /** Verificar Refresh Token con manejo de errores */
  static verifyRefreshToken(token: string) {
  
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET!);
}

}
