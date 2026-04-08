"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const env_1 = require("./config/env");
const db_1 = require("./config/db");
const logger_1 = require("./utils/logger");
const app_1 = __importDefault(require("./app"));
const start = async () => {
    await (0, db_1.connectDB)();
    app_1.default.listen(env_1.env.PORT, () => {
        logger_1.logger.info(`Server running on http://localhost:${env_1.env.PORT}`);
        logger_1.logger.info(`Frontend allowed at ${env_1.env.FRONTEND_URL}`);
    });
};
start().catch((err) => {
    logger_1.logger.error("Failed to start server", { err });
    process.exit(1);
});
