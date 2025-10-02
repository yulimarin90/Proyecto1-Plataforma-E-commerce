import { Product } from "../../domain/products.entity";
export declare class ProductRepository {
    create(product: Product): Promise<Product>;
    findAll(): Promise<Product[]>;
    findById(id: string): Promise<Product | undefined>;
    update(id: string, updateData: Partial<Product>): Promise<Product | null>;
    delete(id: string): Promise<boolean>;
}
//# sourceMappingURL=products.repository.d.ts.map