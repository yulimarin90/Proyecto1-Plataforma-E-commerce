import { Request, Response, NextFunction } from "express";
export declare const validateProductBody: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const checkProductExists: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=products.middleware.d.ts.map