// en este archivo hacemos lo que hace cada endpoint
import { Request, Response } from "express";
import bcrypt from "bcryptjs"; //encriptar contraseñas antes de guardar
import jwt from "jsonwebtoken";//generar y verificar tokens JWT
import { User } from "../models/user.model";

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, direccion, telefono } = req.body;

    // Validar si el usuario ya existe
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "El usuario ya existe" });

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(password, 8);

    // Crear usuario
    const user = new User({ name, email, direccion, telefono, password: hashedPassword });
    await user.save();

    res.status(201).json({ message: "Usuario registrado correctamente" });
  } catch (error) {
    res.status(500).json({ message: "Error en el servidor", error });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    const isMatch = await bcrypt.compare(password, user.password); //error tipo de dato password
    if (!isMatch) return res.status(400).json({ message: "Credenciales inválidas" });

    // Crear tokens JWT
    const accessToken = jwt.sign({ id: user._id }, process.env.claveS!, { expiresIn: "15m" });
    const refreshToken = jwt.sign({ id: user._id }, process.env.claveS!, { expiresIn: "7d" });

    res.json({ accessToken, refreshToken });
  } catch (error) {
    res.status(500).json({ message: "Error en el servidor", error });
  }
};
