export type { ConnectOptions, IsomorphicWebSocket } from "./types";
import type { ConnectOptions, IsomorphicWebSocket } from "./types";

function isCloudflareWorker(): boolean {
  return typeof WebSocketPair !== "undefined";
}

export async function connect(
  options: ConnectOptions,
): Promise<IsomorphicWebSocket> {
  if (!isCloudflareWorker()) {
    const { connectNode } = await import("./impl.node");
    return connectNode(options);
  } else {
    const { connectCf } = await import("./impl.cf");
    return connectCf(options);
  }
}
