"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductService = void 0;
const products_repository_msql_1 = require("../infraestructure/repositories/products.repository.msql");
const uuid_1 = require("uuid");
class ProductService {
    constructor() {
        this.repository = new products_repository_msql_1.ProductRepository();
    }
    async create(data) {
        const product = {
            id: (0, uuid_1.v4)(),
            createdAt: new Date(),
            updatedAt: new Date(),
            ...data,
        };
        return this.repository.create(product);
    }
    async findAll() {
        return this.repository.findAll();
    }
    async findById(id) {
        return this.repository.findById(id);
    }
    async update(id, data) {
        data.updatedAt = new Date();
        return this.repository.update(id, data);
    }
    async delete(id) {
        return this.repository.delete(id);
    }
}
exports.ProductService = ProductService;
//# sourceMappingURL=products.service.js.map