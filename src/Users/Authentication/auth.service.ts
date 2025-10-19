import jwt from "jsonwebtoken";

export class AuthService {
  // Generar Token (corto plazo)
  static generateAccessToken(payload: object): string {


    return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: "300m" });
  }

  //Generar Refresh Token (largo plazo)
  static generateRefreshToken(payload: object): string {
    return jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, { expiresIn: "7d" });
  }


  static verifyAccessToken(token: string): any {
    try {
      return jwt.verify(token, process.env.JWT_SECRET!);
    } catch (err) {
      throw { status: 401, message: "Access token inválido o expirado" };
    }
  }


  static verifyRefreshToken(token: string) {
  
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET!);
}

}
