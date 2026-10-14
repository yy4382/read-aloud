// Protocol reference and independently captured token:
// https://github.com/rany2/edge-tts/issues/490#issuecomment-6126621790
// https://github.com/rany2/edge-tts/issues/490#issuecomment-6144434032
export const TRUSTED_CLIENT_TOKEN = "6A5AA1D4EAFF4E9FB37E23D68491D6F4";

const WINDOWS_EPOCH_SECONDS = 11644473600;
const TOKEN_WINDOW_SECONDS = 300;
const FILETIME_TICKS_PER_SECOND = 10000000n;

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

    let t = rotate16(
      (multiply(rotate16(x), 0xef0569fb) + multiply(x, keyA)) | 0,
    );
    let q = multiply(t, 0x76f50f34);
    swapSum = (swapSum + multiply(rotate16(q), 0xc3efea97) + q) | 0;
    t = rotate16((multiply(rotate16(y), 0xc31713db) + multiply(y, keyB)) | 0);
    q = multiply(t, 0x1881ce3c);
    swapLast = (multiply(rotate16(q), 0x35bd1ec9) + q) | 0;
    swapSum = (swapSum + swapLast) | 0;

    state = multiply((state + x) | 0, keyA);
    for (const factor of [0xcf98b111, 0x87085b9f, 0x12ceb96d, 0x257e1d83]) {
      state = multiply(rotate16(state), factor);
    }
    sum = (sum + state) | 0;
    t = multiply((state + y) | 0, keyB);
    t = multiply(rotate16(t), 0xa27416f5);
    t = multiply(rotate16(t), 0xd38396ff);
    t = multiply(rotate16(t), 0x7c932b89);
    state = multiply(rotate16(t), 0xbfa49f69);
    sum = (sum + state) | 0;
  }

  const cs64 = new Uint8Array(8);
  const result = new DataView(cs64.buffer);
  result.setUint32(0, swapLast ^ state, true);
  result.setUint32(4, swapSum ^ sum, true);
  return cs64;
}
