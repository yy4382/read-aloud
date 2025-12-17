import type { ConnectOptions, IsomorphicWebSocket } from "./types";

class CfWebSocket implements IsomorphicWebSocket {
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
        // In CF Workers, the WebSocket is already open after accept()
        // This is handled in connectCf by calling listener immediately
        break;
      case "close":
        this.ws.addEventListener("close", (event: CloseEvent) => {
          listener({ code: event.code, reason: event.reason });
        });
        break;
      case "message":
        this.ws.addEventListener("message", (event: MessageEvent) => {
          listener({ data: event.data });
        });
        break;
      case "error":
        this.ws.addEventListener("error", (event: Event) => {
          const errorEvent = event as ErrorEvent;
          listener({ message: errorEvent.message });
        });
        break;
    }
  }
}

export async function connectCf(
  options: ConnectOptions,
): Promise<IsomorphicWebSocket> {
  const resp = await fetch(options.url.replace("wss://", "https://"), {
    headers: {
      Upgrade: "websocket",
      ...options.headers,
    },
  });

  const ws = resp.webSocket;
  if (!ws) {
    throw new Error("Server didn't accept WebSocket connection");
  }

  ws.accept();
  return new CfWebSocket(ws);
}
