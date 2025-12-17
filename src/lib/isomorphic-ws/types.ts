export interface IsomorphicWebSocket {
  readonly readyState: number;
  send(data: string | ArrayBuffer): void;
  close(code?: number, reason?: string): void;
  addEventListener(
    type: "open",
    listener: () => void,
  ): void;
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
}

export interface ConnectOptions {
  url: string;
  headers?: Record<string, string>;
}

export type ConnectFn = (options: ConnectOptions) => Promise<IsomorphicWebSocket>;
