import express, { Express, NextFunction, Request, Response } from "express";
import { readFileSync } from "fs";
import { normalize } from "path";
import { SwaggerMiddleware } from "swagger-express-middleware";
import { customBehaviour } from "./custom_behaviour";
import { loggingMw } from "./middlewares/LoggingMiddleware";
import { notFoundMw } from "./middlewares/NotFoundHandlerMiddleware";
const SwaggerExpressMiddleware = require("swagger-express-middleware");

const app: Express = express();
const swaggerFilePath = process.env.SWAGGER_FILE_PATH || "contract/swagger.yaml";
const dataFilePath = process.env.DATA_FILE_PATH || "data/data-sample.json";
const port = process.env.PORT || "8000";
const pathOnGo = process.env.PATH_ON_GO || false;

SwaggerExpressMiddleware(swaggerFilePath, app, swaggerExpressMiddlewareCallback);

function swaggerExpressMiddlewareCallback(err: any, middleware: SwaggerMiddleware) {
    fetchResources(dataFilePath)
        .then(createMemoryDataStore)
        .then((dataStore) => {
            if (pathOnGo) {
                initPathOnGoExpressApp(middleware);
            } else {
                initExpressApp(dataStore, middleware);
            }
        });
}

function fetchResources(resourcesFilePath: string): Promise<any> {
    return new Promise((resolve, reject) => {
        try {
            const storeContent = readFileSync(normalize(resourcesFilePath), "utf-8");
            const dataResources = SwaggerExpressMiddleware.Resource.parse(storeContent);
            resolve(dataResources);
        } catch (error) {
            console.error("Error when reading the data json file.", error);
            reject(error);
        }
    });
}

function createMemoryDataStore(resource: any | any[]) {
    const dataStore = new SwaggerExpressMiddleware.MemoryDataStore();
    dataStore.save(resource);
    return Promise.resolve(dataStore);
}

function ignoreNullFieldErrors(err: any, req: Request, res: Response, next: NextFunction): any {
    if (/Invalid type: null/.test(err.message)) {
        next();
    }
}

function removeFilename(url: string) {
    const urlAsArray = url.split("/");
    urlAsArray.pop();
    return (urlAsArray.join("/"));
}

function initPathOnGoExpressApp(middleware: SwaggerMiddleware) {
    app.use(
        middleware.validateRequest(),
        middleware.parseRequest(),
    );

    app.post("/__config", (req, res) => {
        const fs = require("fs");
        const path = require("path");
        const urlToFile = path.join("/tmp", req.body.url);
        fs.mkdirSync(removeFilename(urlToFile), { recursive: true });
        fs.writeFile(urlToFile, req.body.content_to_return, (err: Error) => {
            if (err) {
                res.send("An error occured while writing : " + err);
                return;
            }
            res.send("Saved file " + req.body.url);
        });
    });

    function handleFileCall(url: string) {
        const fs = require("fs");
        const p = require("path");
        const path = p.join("/tmp", url);
        let filestat;

        try {
            filestat = fs.lstatSync(path);
        } catch {
            return "Error: file/folder " + path + " does not exist";
        }

        if (filestat.isDirectory()) {
            try {
                const items = fs.readdirSync(path);
                return items;
            } catch (err) {
                return "An error occured while reading directory: " + err;
            }
        } else if (filestat.isFile()) {
            try {
                const data = fs.readFileSync(path);
                return data;
            } catch (err) {
                return "An error occured while reading file: " + err;
            }
        }
    }

    app.get("*", (req, res) => {
        res.send(handleFileCall(req.url));
    });

    app.post("*", (req, res) => {
        res.send(handleFileCall(req.url));
    });

    app.listen(port, () => {
        console.log(`The swagger sample is now running at http://localhost:${port}`);
    });
}

function initExpressApp(dataStore: any, middleware: SwaggerMiddleware) {
    app.use(
        loggingMw,
        ignoreNullFieldErrors
    );

    app.get("/api/mock/_health", (req, res) => {
        res.send({ status: "UP" });
    });

    customBehaviour(app, dataStore);

    app.use(
        middleware.metadata(),
        middleware.CORS(),
        middleware.validateRequest(),
        middleware.parseRequest(),
        middleware.mock(dataStore)
    );

    app.use(notFoundMw);

    app.listen(port, () => {
        console.log(`The swagger sample is now running at http://localhost:${port}`);
    });
}
