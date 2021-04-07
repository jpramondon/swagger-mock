import { Request, Response, NextFunction } from "express";
import { mainLogger } from "../Logger";

export function notFoundMw(req: Request, res: Response, next: NextFunction): any {
    mainLogger.error(`${req.url} not found`);
    res.status(404);
    const resObject = {
        message: `Url ${req.url} not found`,
        status: 404,
        url: req.url
    };
    res.json(resObject);
    next();
}