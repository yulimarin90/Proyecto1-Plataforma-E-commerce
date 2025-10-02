import { Request, Response } from "express";
export declare class ProductController {
    create(req: Request, res: Response): Promise<void>;
    getAll(_req: Request, res: Response): Promise<void>;
    getById(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    update(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    delete(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
//# sourceMappingURL=products.controller.d.ts.map