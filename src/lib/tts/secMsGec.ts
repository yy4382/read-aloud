// Protocol reference and independently captured token:
// https://github.com/rany2/edge-tts/issues/490#issuecomment-6126621790
// https://github.com/rany2/edge-tts/issues/490#issuecomment-6144434032
export const TRUSTED_CLIENT_TOKEN = "6A5AA1D4EAFF4E9FB37E23D68491D6F4";

// The token version and User-Agent must advertise the same Edge build; bump them together.
// related project commits:
// https://github.com/rany2/edge-tts/commit/cb6715f38d3132c6a3df256fb2471018fcfdde0a
// https://github.com/rany2/edge-tts/commit/8da91459c8160ca7bc1cdedc8f7f6fd2137fa946
const CHROMIUM_FULL_VERSION = "143.0.3650.75";
const CHROMIUM_MAJOR_VERSION = CHROMIUM_FULL_VERSION.split(".")[0];
export const SEC_MS_GEC_VERSION = `2-${CHROMIUM_FULL_VERSION}`;
export const EDGE_USER_AGENT = `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${CHROMIUM_MAJOR_VERSION}.0.0.0 Safari/537.36 Edg/${CHROMIUM_MAJOR_VERSION}.0.0.0`;

const WINDOWS_EPOCH_SECONDS = 11644473600;
const TOKEN_WINDOW_SECONDS = 300;
const FILETIME_TICKS_PER_SECOND = 10000000n;

// CS64 multipliers, applied to the first (x) and second (y) word of each pair.
const SWAP_X_FACTORS = [0xef0569fb, 0x76f50f34, 0xc3efea97] as const;
const SWAP_Y_FACTORS = [0xc31713db, 0x1881ce3c, 0x35bd1ec9] as const;
const STATE_X_FACTORS = [0xcf98b111, 0x87085b9f, 0x12ceb96d, 0x257e1d83];
const STATE_Y_FACTORS = [0xa27416f5, 0xd38396ff, 0x7c932b89, 0xbfa49f69];

const rotate16 = (value: number) => (value << 16) | (value >>> 16);
const multiply = Math.imul; // Preserve the low 32 bits without float rounding.

/** Generate the v2 CS64-SHA256 token for the current five-minute window. */
export async function generateSecMsGec(now = Date.now()): Promise<string> {
  const seconds = Math.floor(now / 1000) + WINDOWS_EPOCH_SECONDS;
  const ticks =
    BigInt(seconds - (seconds % TOKEN_WINDOW_SECONDS)) *
    FILETIME_TICKS_PER_SECOND;
  // This literal prefix is part of Microsoft's token input, not a source notice.
  const data = new TextEncoder().encode(
    `Copyright (C) Microsoft Corporation. All rights reserved.${ticks}${TRUSTED_CLIENT_TOKEN}`,
  );
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", data));
  return `${hex(cs64Digest(data, digest))}-${hex(digest)}`;
}

function hex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

/** CS64 combines the word-swap and reversible chains keyed by SHA-256.
 * Every multiply and accumulator wraps at 32 bits; output words are little-endian.
 */
function cs64Digest(data: Uint8Array, digest: Uint8Array): Uint8Array {
  const digestView = new DataView(digest.buffer);
  const keyA = digestView.getUint32(0, true) | 1;
  const keyB = digestView.getUint32(4, true) | 1;

  // CS64 consumes little-endian word pairs, zero-padded to eight bytes.
  const padded = new Uint8Array(Math.ceil(data.length / 8) * 8);
  padded.set(data);
  const words = new DataView(padded.buffer);
  let swapSum = 0;
  let swapLast = 0;
  let state = 0;
  let sum = 0;
  for (let offset = 0; offset < padded.length; offset += 8) {
    const x = words.getUint32(offset, true);
    const y = words.getUint32(offset + 4, true);

    // Word-swap chain: each word is mixed independently.
    const swapX = swapMix(x, keyA, SWAP_X_FACTORS);
    swapLast = swapMix(y, keyB, SWAP_Y_FACTORS);
    swapSum = (swapSum + swapX + swapLast) | 0;

    // Reversible chain: each word is folded into the running state.
    state = stateMix((state + x) | 0, keyA, STATE_X_FACTORS);
    sum = (sum + state) | 0;
    state = stateMix((state + y) | 0, keyB, STATE_Y_FACTORS);
    sum = (sum + state) | 0;
  }

  const cs64 = new Uint8Array(8);
  const result = new DataView(cs64.buffer);
  result.setUint32(0, swapLast ^ state, true);
  result.setUint32(4, swapSum ^ sum, true);
  return cs64;
}

function swapMix(
  word: number,
  key: number,
  [pre, mid, post]: readonly [number, number, number],
): number {
  const t = rotate16((multiply(rotate16(word), pre) + multiply(word, key)) | 0);
  const q = multiply(t, mid);
  return (multiply(rotate16(q), post) + q) | 0;
}

function stateMix(value: number, key: number, factors: number[]): number {
  let state = multiply(value, key);
  for (const factor of factors) {
    state = multiply(rotate16(state), factor);
  }
  return state;
}
