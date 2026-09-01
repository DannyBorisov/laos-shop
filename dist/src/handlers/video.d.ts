import { Request, Response } from "express";
export declare const upload: (req: Request, res: Response) => Promise<void>;
export declare const getUrl: (req: Request, res: Response) => Promise<void>;
export declare const remove: (req: Request, res: Response) => Promise<void>;
