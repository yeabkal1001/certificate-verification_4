import pino from "pino";
import pretty from "pino-pretty";

// Configure log level based on environment
const level = process.env.LOG_LEVEL || (process.env.NODE_ENV === "production" ? "info" : "debug");

// Create a stream for pretty printing in development
const stream = pretty({
  colorize: process.env.NODE_ENV !== "production",
  translateTime: "yyyy-mm-dd HH:MM:ss",
  ignore: "pid,hostname",
});

// Create the logger instance
const logger = pino(
  {
    level,
    // Add application name and version
    base: {
      app: "certificate-verification",
      version: process.env.npm_package_version,
      env: process.env.NODE_ENV,
    },
    // Redact sensitive information
    redact: {
      paths: [
        "password",
        "*.password",
        "passwordHash",
        "*.passwordHash",
        "token",
        "*.token",
        "secret",
        "*.secret",
      ],
      censor: "[REDACTED]",
    },
  },
  process.env.NODE_ENV === "production" ? undefined : stream
);

export default logger;