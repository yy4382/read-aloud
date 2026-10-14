# Edge TTS connection token

Microsoft began rejecting v1 `Sec-MS-GEC` tokens in October 2026 ([read-aloud #16](https://github.com/yy4382/read-aloud/issues/16), [ifreetime #10](https://github.com/yy4382/ms-ra-forwarder-for-ifreetime/issues/10)).

`secMsGec.ts` implements the v2 token independently using Web Crypto SHA-256 and unsigned 32-bit CS64 arithmetic. The connection URL must advertise `Sec-MS-GEC-Version=2-{browser version}` along with this token.

## Protocol evidence

- [gexgd0419's algorithm reconstruction](https://github.com/rany2/edge-tts/issues/490#issuecomment-6126621790) explains the input prefix, CS64 word-swap and reversible chains, little-endian output, and `16 hex-64 hex` token format.
- [HarryXiaoCN's independent packet capture and replay](https://github.com/rany2/edge-tts/issues/490#issuecomment-6144434032) confirms the token change causes the 403 and provides the captured token used in the regression test. It also confirms the existing host/path still works with v2.

## Implementation constraints

The token input is the literal Microsoft copyright prefix, followed immediately by the Windows FILETIME ticks for the preceding five-minute boundary and the trusted client token. The prefix is protocol data. FILETIME ticks use `BigInt` to preserve integer precision. SHA-256 covers the full input; its first two little-endian words key CS64. `Math.imul` and bitwise truncation keep CS64 arithmetic at 32 bits, avoiding JavaScript floating-point multiplication errors. CS64's two result words are serialized little-endian; both digests are uppercase hex.

Token generation is isolated from WebSocket transport and headers so Node, Vercel, and Cloudflare Workers use the same implementation. The sibling project's `service/edge/secMsGec.ts` implements the same protocol and uses the same fixtures; keep the fixtures aligned when the upstream protocol changes.

Run `pnpm test` for the captured token, a second reference date, the five-minute boundary, and URL version checks. These checks need no network. For a live check, start the local server and request `/api/synthesis?text=Hello&voiceName=en-US-AriaNeural`; verify HTTP 200, `audio/mpeg`, and decodable audio. A successful build alone does not verify Microsoft's handshake.
