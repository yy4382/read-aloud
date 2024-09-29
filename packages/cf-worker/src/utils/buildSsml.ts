import { x } from "xastscript";
import type { Element } from "xast";
import { toXml } from "xast-util-to-xml";

export default function buildSsml(
  text: string,
  options: {
    voiceName: string;
    pitch?: string;
    rate?: string;
    volume?: string;
  },
) {
  const { voiceName, pitch, rate, volume } = options;
  function wrapProsody(text: string) {
    if (!pitch && !rate && !volume) {
      return text;
    }
    return x("prosody", { pitch, rate, volume }, text);
  }
  function wrapVoice(child: Element | string) {
    return x("voice", { name: voiceName }, child);
  }

  return toXml(
    x(
      "speak",
      {
        version: "1.0",
        xmlns: "http://www.w3.org/2001/10/synthesis",
        "xml:lang": "zh-CN",
      },
      [wrapVoice(wrapProsody(text))],
    ),
  );
}
