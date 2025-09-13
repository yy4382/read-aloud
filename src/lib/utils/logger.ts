import pino from "pino";

const logger = pino({
  transport: {
    target: "pino-pretty",
  },
  level:
    process.env.DEBUG === "1" || process.env.DEBUG === "true"
      ? "debug"
      : "info",
  browser: {
    formatters: {
      level: (label, number) => {
        return { level: label };
      },
    },
    // biome-ignore lint/suspicious/noExplicitAny: any
    write: (obj: any) => {
      const level = obj.level.toUpperCase();
      const timestamp = new Date(obj.time).toISOString();
      const logParams = [`[${timestamp}] ${level}: ${obj.msg}`];
      for (const key in obj) {
        if (key === "level" || key === "msg" || key === "time") continue;
        logParams.push("\n");
        logParams.push(`\t${key}: `);
        logParams.push(obj[key]);
      }
      console.log(...logParams);
    },
  },
});

export default logger;
