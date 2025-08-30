import { z, OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { env, getRuntimeKey } from "hono/adapter";
import { HTTPException } from "hono/http-exception";
import { FORMAT_CONTENT_TYPE } from "../lib/tts/synthesis";
import { Service } from "../lib/tts/synthesis";
import retry, { RetryError } from "../lib/utils/retry";
import buildSsml from "../lib/tts/buildSsml";
type Bindings = {
  TOKEN: string;
};
const synthesis = new OpenAPIHono<{ Bindings: Bindings }>();
export default synthesis;

const querySchema = z.object({
  voiceName: z
    .string()
    .optional()
    .openapi({
      param: { description: "语音名称" },
      example: "zh-CN-XiaoxiaoNeural",
    }),
  pitch: z
    .string()
    .optional()
    .openapi({
      param: { description: "音高" },
      examples: ["-50%", "-50Hz", "low"],
    }),
  rate: z
    .string()
    .optional()
    .openapi({ param: { description: "语速" } }),
  volume: z
    .string()
    .optional()
    .openapi({ param: { description: "音量" } }),
  format: z
    .string()
    .optional()
    .openapi({ param: { description: "音频格式" } }),
  token: z
    .string()
    .optional()
    .openapi({ param: { description: "Token" } }),
  text: z.string().openapi({ param: { description: "合成文本" } }),
});

const route = createRoute({
  method: "get",
  path: "/",
  request: { query: querySchema },
  responses: {
    200: { description: "返回音频" },
    401: { description: "Unauthorized" },
    500: { description: "Error" },
  },
});

synthesis.openapi(route, async (c) => {
  const {
    voiceName = "zh-CN-XiaoxiaoNeural",
    rate,
    pitch,
    text = "",
    format = "audio-24khz-48kbitrate-mono-mp3",
    volume,
    token,
  } = c.req.valid("query");

  const debug = env(c).DEBUG === "1" || env(c).DEBUG === "true";
  const systemToken = env(c).TOKEN;

  if (systemToken !== "" && systemToken !== undefined) {
    if (token !== systemToken) {
      c.status(401);
      return c.text("Unauthorized");
    }
  }

  if (!FORMAT_CONTENT_TYPE.has(format)) {
    throw new HTTPException(400, { message: `无效的音频格式：${format}` });
  }
  const ssml = buildSsml(text, { voiceName, pitch, rate, volume });
  debug && console.debug("SSML:", ssml);

  // getting service instance, cloudflare workerd has limitation that each request
  // should not share IO objects, so we need to create a new instance for each request
  let service: Service;
  if (getRuntimeKey() === "node") {
    service = await import("../lib/tts/instance").then((m) => m.service);
  } else {
    // workerd
    service = new Service();
  }

  if (debug) {
    service.debug = true;
  }

  try {
    const result = await retry(
      async () => {
        const result = await service.convert(ssml, format as string);
        return result;
      },
      3,
      (index, error, abort) => {
        console.warn(`Attempt ${index} failed：${error}`);
        if (
          error instanceof Error &&
          error.message.includes("SSML is invalid")
        ) {
          abort();
          throw new HTTPException(400, { message: "SSML 无效" });
        }
      },
    );
    c.header("Content-Type", FORMAT_CONTENT_TYPE.get(format));
    return c.body(result.buffer as ArrayBuffer);
  } catch (error) {
    if (error instanceof HTTPException) throw error;
    c.status(500);
    if (!(error instanceof RetryError))
      throw new HTTPException(500, {
        message: `UnknownError: ${(error as string).toString()}`,
      });
    throw new HTTPException(500, {
      message: `${error.message}. Cause: ${error.cause.map((e) => (e as Error).toString()).join(", ")}`,
    });
  }
});
