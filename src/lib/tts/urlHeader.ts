import { randomBytes, randomUUID } from "node:crypto";
import {
  EDGE_USER_AGENT,
  generateSecMsGec,
  SEC_MS_GEC_VERSION,
  TRUSTED_CLIENT_TOKEN,
} from "./secMsGec";

export async function getURLAndHeaders() {
  const connectionId = randomUUID().toLowerCase();

  const muid = randomBytes(16).toString("hex").toUpperCase();

  const url = `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=${TRUSTED_CLIENT_TOKEN}&Sec-MS-GEC=${await generateSecMsGec()}&Sec-MS-GEC-Version=${SEC_MS_GEC_VERSION}&ConnectionId=${connectionId}`;
  const headers = {
    "User-Agent": EDGE_USER_AGENT,
    "Accept-Encoding": "gzip, deflate, br, zstd", // not required by microsoft for now
    "Accept-Language": "en-US,en;q=0.9", // not required by microsoft for now
    Pragma: "no-cache", // not required by microsoft for now,
    "Cache-Control": "no-cache", // not required by microsoft for now,
    Cookie: `muid=${muid};`,
  };
  return [url, headers] as const;
}
