import { Product } from "../domain/products.entity";
export declare class ProductService {
    private repository;
    create(data: Omit<Product, "id" | "createdAt" | "updatedAt">): Promise<Product>;
    findAll(): Promise<Product[]>;
    findById(id: string): Promise<Product | undefined>;
    update(id: string, data: Partial<Product>): Promise<Product | null>;
    delete(id: string): Promise<boolean>;
}
//# sourceMappingURL=products.service.d.ts.map