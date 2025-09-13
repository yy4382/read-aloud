import pino from "pino";

/**
 * Since Vercel functions cannot use pino-pretty, we need to check if the node is running in a normal node environment.
 */
function isNormalNode():boolean {
  const isNode = (typeof process !== 'undefined') && (process.release.name === 'node');
  const isVercel = (typeof process !== 'undefined') && (process.env.VERCEL === '1');
  return isNode && !isVercel;
}

const logger = pino({
  transport: isNormalNode() ? {
    target: "pino-pretty",
  } : undefined,
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
