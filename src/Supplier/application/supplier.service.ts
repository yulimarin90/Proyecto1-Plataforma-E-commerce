import { ISuppliersRepository, SuppliersRepository } from "../infraestructure/repositories/supplier.repository";
import { Supplier } from "../domain/supplier.entity";

export class SuppliersService {
  constructor(private suppliersRepository: ISuppliersRepository) {}

  async createSupplier(supplier: Supplier) {
    const exists = await this.suppliersRepository.findByName(supplier.name);
    if (exists) throw { status: 409, message: "Proveedor ya existe" };
    const id = await this.suppliersRepository.create(supplier);
    return await this.suppliersRepository.findById(id);
  }

  async getAllSuppliers() {
    return await this.suppliersRepository.findAll();
  }

  async getSupplierById(id: number) {
    const supplier = await this.suppliersRepository.findById(id);
    if (!supplier) throw { status: 404, message: "Proveedor no encontrado" };
    return supplier;
  }

  async updateSupplier(id: number, data: Partial<Supplier>) {
    const supplier = await this.suppliersRepository.findById(id);
    if (!supplier) throw { status: 404, message: "Proveedor no encontrado" };

    if (data.name && data.name !== supplier.name) {
      const exists = await this.suppliersRepository.findByName(data.name);
      if (exists) throw { status: 409, message: "Nombre de proveedor ya en uso" };
    }

    return await this.suppliersRepository.update(id, { ...supplier, ...data });
  }

  async deleteSupplier(id: number) {
    const supplier = await this.suppliersRepository.findById(id);
    if (!supplier) throw { status: 404, message: "Proveedor no encontrado" };
    await this.suppliersRepository.delete(id);
  }
}