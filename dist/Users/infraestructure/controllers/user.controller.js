"use strict";
/*Adaptador de Express → aplicación.

Recibe req y res, valida, y llama a los servicios.

Su trabajo: traducir HTTP → casos de uso

nos traemos por inyeccion de dependencias lo que esta en aplication y poder ejecutar
el caso de uso*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAccount = exports.replaceAccount = exports.updateAccount = exports.getProfile = exports.login = exports.register = void 0;
const user_service_1 = require("../../application/user.service");
const user_repository_msql_1 = require("../../infraestructure/repositories/user.repository.msql");
const userService = new user_service_1.UserService(new user_repository_msql_1.MySQLUserRepository());
const register = async (req, res) => {
    try {
        const body = {
            ...req.body,
            phone: req.body.telefono, // ✅ mapeo temporal
        };
        delete body.telefono;
        const result = await userService.register(body);
        res.status(201).json({ message: "Usuario creado. Revisa tu correo.", ...result });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const result = await userService.login(email, password);
        res.status(200).json(result);
    }
    catch (error) {
        res.status(error.status || 400).json({ message: error.message });
    }
};
exports.login = login;
const getProfile = async (req, res) => {
    try {
        // El usuario ya viene en req.user desde el middleware
        res.json({ user: req.user });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getProfile = getProfile;
const updateAccount = async (req, res) => {
    try {
        const userId = req.user.id;
        const updatedUser = await userService.updateAccount(userId, req.body); // ✅ corregido
        res.json(updatedUser);
    }
    catch (error) {
        console.error("Error en updateAccount:", error);
        res.status(500).json({ message: error.message });
    }
};
exports.updateAccount = updateAccount;
const replaceAccount = async (req, res) => {
    try {
        const userId = req.user.id;
        const replacedUser = await userService.replaceAccount(userId, req.body); // ✅ corregido
        res.json(replacedUser);
    }
    catch (error) {
        console.error("Error en replaceAccount:", error);
        res.status(500).json({ message: error.message });
    }
};
exports.replaceAccount = replaceAccount;
const deleteAccount = async (req, res) => {
    try {
        const userId = req.user.id;
        await userService.deleteAccount(userId); // ✅ corregido
        res.status(204).send();
    }
    catch (error) {
        console.error("Error en deleteAccount:", error);
        res.status(500).json({ message: error.message });
    }
};
exports.deleteAccount = deleteAccount;
//# sourceMappingURL=user.controller.js.map