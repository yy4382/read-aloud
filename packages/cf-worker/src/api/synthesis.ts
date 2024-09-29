import { Hono } from "hono";
import { Service, FORMAT_CONTENT_TYPE } from "../utils/synthesis";
import retry from "../utils/retry";
type Bindings = {
  TOKEN: string;
};
const synthesis = new Hono<{ Bindings: Bindings }>();
export default synthesis;

synthesis.get("/", async (c) => {
  const {
    voiceName = "zh-CN-XiaoxiaoNeural",
    speed = "0.00",
    text = "",
    token = "",
  } = c.req.query();
  console.log(token, c.env.TOKEN);
  if (token !== c.env.TOKEN) {
    c.status(403);
    return c.text("Forbidden");
  }
  const service = new Service();
  const format =
    c.req.header("format") ??
    c.req.query("format") ??
    "audio-24khz-48kbitrate-mono-mp3";
  try {
    if (Array.isArray(format)) {
      throw `无效的音频格式：${format}`;
    }
    if (!FORMAT_CONTENT_TYPE.has(format)) {
      throw `无效的音频格式：${format}`;
    }
    const ssml = `<speak xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" xmlns:emo="http://www.w3.org/2009/10/emotionml" version="1.0" xml:lang="zh-CN"><voice name="${voiceName}"><prosody rate="${speed}%">${text}</prosody></voice></speak>`;
    const result = await retry(
      async () => {
        const result = await service.convert(ssml, format as string);
        return result;
      },
      3,
      (index, error) => {
        console.warn(`Attempt ${index} failed：${error}`);
      },
    );
    c.header("Content-Type", FORMAT_CONTENT_TYPE.get(format));
    return c.body(result);
  } catch (error) {
    c.status(500);
    if (!(error instanceof Error)) return c.text("Error");
    console.error(`发生错误, ${error.message}`);
    return c.text(error.message);
  }
});
