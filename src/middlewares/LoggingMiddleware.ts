import { Request, Response, NextFunction } from "express";
import { mainLogger } from "../Logger";

export function loggingMw(req: Request, res: Response, next: NextFunction): any {
    mainLogger.info(`${req.url} called`);
    next();
}