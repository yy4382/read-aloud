import { randomBytes, randomUUID } from "node:crypto";

function buf2hex(buffer: ArrayBuffer) {
  return [...new Uint8Array(buffer)]
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");
}

// provided by and modified from @rexshao
// https://github.com/yy4382/read-aloud/issues/4#issue-3048109976
export async function getURLAndHeaders() {
  const connectionId = randomUUID().toLowerCase();
  const TRUSTED_CLIENT_TOKEN = "6A5AA1D4EAFF4E9FB37E23D68491D6F4";
  const WIN_EPOCH = 11644473600; // 秒，从Windows纪元到Unix纪元的偏移量
  const S_TO_NS = BigInt(1e9);
  const CHROMIUM_FULL_VERSION = "143.0.3650.75";
  const CHROMIUM_MAJOR_VERSION = CHROMIUM_FULL_VERSION.split(".")[0];
  const SEC_MS_GEC_VERSION = `1-${CHROMIUM_FULL_VERSION}`;
  async function generateSecMSGEC() {
    const currentTimestampSeconds = Math.floor(Date.now() / 1000);

    // 调整时间到最近的5分钟（300秒）边界
    let adjustedSeconds = currentTimestampSeconds + WIN_EPOCH;
    adjustedSeconds -= adjustedSeconds % 300;

    // 将调整后的时间转换为Windows文件时间（十亿分之一纳秒单位）
    const winFileTime = BigInt(adjustedSeconds) * (S_TO_NS / 100n);

    // 构造待哈希的字符串
    const hashInput = `${winFileTime.toString()}${TRUSTED_CLIENT_TOKEN}`;

    // 计算SHA-256哈希并转为大写十六进制格式
    const encoder = new TextEncoder();
    const hashInputBuffer = encoder.encode(hashInput);
    const hashBuffer = await crypto.subtle.digest("SHA-256", hashInputBuffer);
    const sha256Hash = buf2hex(hashBuffer);
    // const sha256Hash = createHash("sha256").update(hashInput).digest("hex");

    return sha256Hash.toUpperCase();
  }

  const muid = randomBytes(16).toString("hex").toUpperCase();

  const url = `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=${TRUSTED_CLIENT_TOKEN}&Sec-MS-GEC=${await generateSecMSGEC()}&Sec-MS-GEC-Version=${SEC_MS_GEC_VERSION}&ConnectionId=${connectionId}`;
  const headers = {
    "User-Agent": `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${CHROMIUM_MAJOR_VERSION}.0.0.0 Safari/537.36 Edg/${CHROMIUM_MAJOR_VERSION}.0.0.0`,
    "Accept-Encoding": "gzip, deflate, br, zstd", // not required by microsoft for now
    "Accept-Language": "en-US,en;q=0.9", // not required by microsoft for now
    Pragma: "no-cache", // not required by microsoft for now,
    "Cache-Control": "no-cache", // not required by microsoft for now,
    Cookie: `muid=${muid};`,
  };
  return [url, headers] as const;
}
