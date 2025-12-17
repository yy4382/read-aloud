import { WebSocket } from "ws";
import type { ConnectOptions, IsomorphicWebSocket } from "./types";

class NodeWebSocket implements IsomorphicWebSocket {
  private ws: WebSocket;

  constructor(ws: WebSocket) {
    this.ws = ws;
  }

  get readyState(): number {
    return this.ws.readyState;
  }

  send(data: string | ArrayBuffer): void {
    this.ws.send(data);
  }

  close(code?: number, reason?: string): void {
    this.ws.close(code, reason);
  }

  addEventListener(type: "open", listener: () => void): void;
  addEventListener(
    type: "close",
    listener: (event: { code: number; reason: string }) => void,
  ): void;
  addEventListener(
    type: "message",
    listener: (event: { data: string | ArrayBuffer }) => void,
  ): void;
  addEventListener(
    type: "error",
    listener: (event: { message?: string }) => void,
  ): void;
  addEventListener(
    type: "open" | "close" | "message" | "error",
    _listener: unknown, // bypass type checking here
  ): void {
    const listener = _listener as (event?: unknown) => void;
    switch (type) {
      case "open":
        this.ws.on("open", listener);
        break;
      case "close":
        this.ws.on("close", (code: number, reason: Buffer) => {
          listener({ code, reason: reason.toString() });
        });
        break;
      case "message":
        this.ws.on(
          "message",
          (data: Buffer | ArrayBuffer | Buffer[], isBinary: boolean) => {
            if (isBinary) {
              const buffer =
                data instanceof Buffer
                  ? data
                  : Buffer.concat(
                      (data instanceof ArrayBuffer
                        ? [Buffer.from(data)]
                        : data) as any,
                    );
              listener({
                data: buffer.buffer.slice(
                  buffer.byteOffset,
                  buffer.byteOffset + buffer.byteLength,
                ),
              });
            } else {
              listener({ data: data.toString() });
            }
          },
        );
        break;
      case "error":
        this.ws.on("error", (err: Error) => {
          listener({ message: err.message });
        });
        break;
    }
  }
}

export function connectNode(
  options: ConnectOptions,
): Promise<IsomorphicWebSocket> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(options.url, { headers: options.headers });

    ws.on("open", () => {
      resolve(new NodeWebSocket(ws));
    });

    ws.on("error", (err) => {
      reject(err);
    });
  });
}
