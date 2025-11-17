import pino from "pino";

// Create a Pino logger instance
const logger = pino({
  level: process.env.NODE_ENV !== "production" ? "debug" : "info",
  transport:
    process.env.NODE_ENV !== "production"
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:standard",
            ignore: "pid,hostname",
          },
        }
      : undefined,
  // Handle Error objects properly
  serializers: {
    err: pino.stdSerializers.err,
  },
});

export default logger;
