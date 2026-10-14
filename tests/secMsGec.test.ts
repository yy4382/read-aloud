import { strict as assert } from "node:assert";
import { test } from "node:test";
import { generateSecMsGec } from "../src/lib/tts/secMsGec";
import { getURLAndHeaders } from "../src/lib/tts/urlHeader";

// Independently captured from Edge:
// https://github.com/rany2/edge-tts/issues/490#issuecomment-6144434032
const captured =
  "492D7694A183A45E-56E821F95D4579C5B7C7E33DC7303FF379EC36D510213555BBBB9EB17EF15876";

test("v2 token matches the independently captured Edge token", async () => {
  assert.equal(
    await generateSecMsGec(Date.parse("2026-10-13T10:40:00Z")),
    captured,
  );
});

test("token stays stable within a five-minute window and changes at its boundary", async () => {
  assert.equal(
    await generateSecMsGec(Date.parse("2026-10-13T10:44:59.999Z")),
    captured,
  );
  assert.equal(
    await generateSecMsGec(Date.parse("2026-10-13T10:45:00Z")),
    "6D26B5F5B70269AD-280E82E1BBE24E4E8866E3502EB6277B9436F61ABDC1C224518A038BBD7BBDAD",
  );
});

test("v2 token matches a second reference date", async () => {
  assert.equal(
    await generateSecMsGec(Date.parse("2025-01-01T00:00:00Z")),
    "54404AFE67C9B44A-E72E51D8B4F5F75E9A96B7E20D7877227455BC310433BD30C817CD54A1D9313E",
  );
});

test("WebSocket URL pairs the v2 token with the v2 version", async () => {
  const [url] = await getURLAndHeaders();
  const parsed = new URL(url);
  assert.equal(parsed.protocol, "wss:");
  assert.equal(parsed.hostname, "speech.platform.bing.com");
  assert.equal(
    parsed.searchParams.get("Sec-MS-GEC-Version"),
    "2-143.0.3650.75",
  );
  assert.match(
    parsed.searchParams.get("Sec-MS-GEC")!,
    /^[A-F0-9]{16}-[A-F0-9]{64}$/,
  );
});
