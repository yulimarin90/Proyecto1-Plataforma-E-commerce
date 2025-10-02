// Entidad e interfaces , reglas del negocio 
export interface User {
  id?: number;
  name: string;
  email: string;
  password: string;
  phone: number;
  address: string;
  created_at?: Date;
  failed_attempts?: number;
  locked_until?: Date | null;
  is_verified?: boolean;
  verification_token?: string | null;
  verification_expires?: Date | null;
}
