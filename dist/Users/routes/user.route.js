"use strict";
/*Define las rutas HTTP de Express.

Apunta cada endpoint a un controller y (opcionalmente) a un middleware.*/
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const UserController = __importStar(require("../infraestructure/controllers/user.controller"));
const user_middleware_1 = __importDefault(require("../infraestructure/middlewares/user.middleware"));
const router = (0, express_1.Router)();
// Rutas públicas
router.post("/auth/register", UserController.register);
router.post("/auth/login", UserController.login);
// Rutas protegidas
router.get("/users/me", user_middleware_1.default, UserController.getProfile);
router.patch("/users/me", user_middleware_1.default, UserController.updateAccount);
router.put("/users/me", user_middleware_1.default, UserController.replaceAccount);
router.delete("/users/me", user_middleware_1.default, UserController.deleteAccount);
exports.default = router;
//# sourceMappingURL=user.route.js.map