import { Schema, model, Document } from "mongoose"; 
//base de datos mongoose, cambia según la base que vamos a utilizar

export interface IUser extends Document {

    //en este archivo defino la estructura de los datos y como se guardan en la base de datos 
  cedula: number;                // Identificador
  name: string;              // Nombre
  email: string;      // Correo unico
  password: string;             // Contraseña mínimo 8 caracteres
  direccion?: number;             // Direccion (opcional)
  telefono: number,              //telefono 
}

const userSchema = new Schema<IUser>(
  {
        name: { type: String, required: true },
    direccion: { type: String, required: false },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    telefono: { type: Number, required: true},
  },
);

export const User = model<IUser>("User", userSchema);