// Entidad e interfaces , reglas del negocio 
// Para cuando se crea un nuevo usuario 
export interface NewUser {
  name: string;
  email: string;
  password: string;
  phone: number;
  address: string;
  verification_token?: string | null;
  verification_expires?: Date | null;
}

// Para usuarios que ya existen 
export interface User extends NewUser {
  id: number;
  created_at?: Date;
  failed_attempts: number;
  locked_until: Date | null;
  is_verified: boolean;
  refresh_token?: string | null;
}
