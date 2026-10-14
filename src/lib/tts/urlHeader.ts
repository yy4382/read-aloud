import { randomBytes, randomUUID } from "node:crypto";
import { generateSecMsGec, TRUSTED_CLIENT_TOKEN } from "./secMsGec";

// provided by and modified from @rexshao
// https://github.com/yy4382/read-aloud/issues/4#issue-3048109976
export async function getURLAndHeaders() {
  const connectionId = randomUUID().toLowerCase();
  const CHROMIUM_FULL_VERSION = "143.0.3650.75";
  const CHROMIUM_MAJOR_VERSION = CHROMIUM_FULL_VERSION.split(".")[0];
  const SEC_MS_GEC_VERSION = `2-${CHROMIUM_FULL_VERSION}`;

  const muid = randomBytes(16).toString("hex").toUpperCase();

  const url = `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=${TRUSTED_CLIENT_TOKEN}&Sec-MS-GEC=${await generateSecMsGec()}&Sec-MS-GEC-Version=${SEC_MS_GEC_VERSION}&ConnectionId=${connectionId}`;
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
