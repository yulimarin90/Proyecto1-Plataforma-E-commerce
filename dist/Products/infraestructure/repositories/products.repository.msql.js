"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductRepository = void 0;
const products = [];
class ProductRepository {
    async create(product) {
        products.push(product);
        return product;
    }
    async findAll() {
        return products;
    }
    async findById(id) {
        return products.find(p => p.id === id);
    }
    async update(id, updateData) {
        const index = products.findIndex(p => p.id === id);
        if (index === -1)
            return null;
        products[index] = { ...products[index], ...updateData };
        return products[index];
    }
    async delete(id) {
        const index = products.findIndex(p => p.id === id);
        if (index === -1)
            return false;
        products.splice(index, 1);
        return true;
    }
}
exports.ProductRepository = ProductRepository;
//# sourceMappingURL=products.repository.msql.js.map