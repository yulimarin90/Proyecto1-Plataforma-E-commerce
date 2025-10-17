import { Request, Response } from "express";
import { SuppliersService } from "../../application/supplier.service";
import { SuppliersRepository } from "../repositories/supplier.repository";

let suppliersService = new SuppliersService(new SuppliersRepository());
// Setter para pruebas: permite inyectar un mock desde los tests de integración
export const setSuppliersService = (svc: any) => {
  suppliersService = svc;
};

const parseBoolToNumber = (value: any, defaultValue: number = 1) => {
  if (value === undefined || value === null) return defaultValue;
  if (value === true || value === "true" || value === "1" || value === 1) return 1;
  return 0;
};

export const createSupplier = async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    payload.is_active = parseBoolToNumber(payload.is_active, 1);

    const result = await suppliersService.createSupplier(payload);
    res.status(201).json({ message: "Proveedor creado", supplier: result });
  } catch (error: any) {
    res.status(error.status || 500).json({ message: error.message });
  }
};

export const getSuppliers = async (_req: Request, res: Response) => {
  try {
    const suppliers = await suppliersService.getAllSuppliers();
    res.status(200).json(suppliers);
  } catch (error: any) {
    res.status(error.status || 500).json({ message: error.message });
  }
};

export const updateSupplier = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.supplier_id); 
    if (isNaN(id)) return res.status(400).json({ message: "ID inválido" });

    const payload = req.body;
    if (payload.is_active !== undefined) payload.is_active = parseBoolToNumber(payload.is_active);

    const updated = await suppliersService.updateSupplier(id, payload);
    res.status(200).json({ message: "Proveedor actualizado", supplier: updated });
  } catch (error: any) {
    res.status(error.status || 500).json({ message: error.message });
  }
};

export const deleteSupplier = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.supplier_id);
    if (isNaN(id)) return res.status(400).json({ message: "ID inválido" });

    await suppliersService.deleteSupplier(id);
    res.status(200).json({ message: "Proveedor eliminado" });
  } catch (error: any) {
    res.status(error.status || 500).json({ message: error.message });
  }
};