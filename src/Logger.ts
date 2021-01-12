import winston from "winston";

const logFormat = winston.format.printf(({ level, message, label, timestamp }) => {
    return `${timestamp} [${label}] ${level}: ${message}`;
});

export const mainLogger: winston.Logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.label({ label: 'mainLogger' }),
        winston.format.timestamp(),
        logFormat
      ),
    transports: [
        new winston.transports.Console({ level: 'info' }),
    ],
});