import { connect, type IsomorphicWebSocket } from "../isomorphic-ws";
import logger from "../utils/logger";
import type * as pino from "pino";
import { getURLAndHeaders } from "./urlHeader";

const WS_OPEN = 1;

export const FORMAT_CONTENT_TYPE = new Map([
  ["raw-16khz-16bit-mono-pcm", "audio/basic"],
  ["raw-48khz-16bit-mono-pcm", "audio/basic"],
  ["raw-8khz-8bit-mono-mulaw", "audio/basic"],
  ["raw-8khz-8bit-mono-alaw", "audio/basic"],

  ["raw-16khz-16bit-mono-truesilk", "audio/SILK"],
  ["raw-24khz-16bit-mono-truesilk", "audio/SILK"],

  ["riff-16khz-16bit-mono-pcm", "audio/x-wav"],
  ["riff-24khz-16bit-mono-pcm", "audio/x-wav"],
  ["riff-48khz-16bit-mono-pcm", "audio/x-wav"],
  ["riff-8khz-8bit-mono-mulaw", "audio/x-wav"],
  ["riff-8khz-8bit-mono-alaw", "audio/x-wav"],

  ["audio-16khz-32kbitrate-mono-mp3", "audio/mpeg"],
  ["audio-16khz-64kbitrate-mono-mp3", "audio/mpeg"],
  ["audio-16khz-128kbitrate-mono-mp3", "audio/mpeg"],
  ["audio-24khz-48kbitrate-mono-mp3", "audio/mpeg"],
  ["audio-24khz-96kbitrate-mono-mp3", "audio/mpeg"],
  ["audio-24khz-160kbitrate-mono-mp3", "audio/mpeg"],
  ["audio-48khz-96kbitrate-mono-mp3", "audio/mpeg"],
  ["audio-48khz-192kbitrate-mono-mp3", "audio/mpeg"],

  ["webm-16khz-16bit-mono-opus", "audio/webm; codec=opus"],
  ["webm-24khz-16bit-mono-opus", "audio/webm; codec=opus"],

  ["ogg-16khz-16bit-mono-opus", "audio/ogg; codecs=opus; rate=16000"],
  ["ogg-24khz-16bit-mono-opus", "audio/ogg; codecs=opus; rate=24000"],
  ["ogg-48khz-16bit-mono-opus", "audio/ogg; codecs=opus; rate=48000"],
]);

class SynthesisRequest {
  requestId: string;
  bufferChunks: Uint8Array[];
  successCallback: (buffer: Uint8Array) => void;
  errorCallback: (error: Error) => void;
  reqLogger: pino.Logger;

  constructor(
    requestId: string,
    successCallback: (buffer: Uint8Array) => void,
    errorCallback: (error: Error) => void,
    reqLogger: pino.Logger,
  ) {
    this.requestId = requestId;
    this.bufferChunks = [];
    this.successCallback = successCallback;
    this.errorCallback = errorCallback;
    this.reqLogger = reqLogger;
  }
  send(ssml: string, format: string, send: (data: string) => void) {
    const configData = {
      context: {
        synthesis: {
          audio: {
            metadataoptions: {
              sentenceBoundaryEnabled: "false",
              wordBoundaryEnabled: "false",
            },
            outputFormat: format,
          },
        },
      },
    };
    const configMessage = `X-Timestamp:${Date()}\r\nContent-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n${JSON.stringify(configData)}`;
    this.reqLogger.debug({ payload: configMessage }, "Send config");
    send(configMessage);

    // 发送SSML消息
    const ssmlMessage = `X-Timestamp:${Date()}\r\nX-RequestId:${this.requestId}\r\nContent-Type:application/ssml+xml\r\nPath:ssml\r\n\r\n${ssml}`;
    this.reqLogger.debug({ payload: ssmlMessage }, "Send SSML");
    send(ssmlMessage);
  }

  handleString(data: string) {
    if (data.includes("Path:turn.start")) {
      // 开始传输
      this.reqLogger.debug("Turn Start：...");
    } else if (data.includes("Path:turn.end")) {
      // 结束传输
      this.reqLogger.debug(
        `Turn End：with ${this.bufferChunks.length} chunks...`,
      );
      const result = concatenate(this.bufferChunks);
      this.successCallback(result);
    }
  }
  handleBuffer(data: Uint8Array) {
    this.bufferChunks.push(data);
  }
}

function parseRequestId(data: string) {
  const pattern = /X-RequestId:(?<id>[a-z|0-9]*)/;
  const matches = data.match(pattern);
  return matches?.groups?.id ?? null;
}

// Path:audio\r\n
const AUDIO_SEP = [80, 97, 116, 104, 58, 97, 117, 100, 105, 111, 13, 10];

function handleMessage(message: { data: string | ArrayBuffer }) {
  const data = message.data;
  switch (typeof data) {
    case "string": {
      const requestId = parseRequestId(data);
      logger.debug({ requestId, payload: data }, "Received string");
      return { requestId, data };
    }
    case "object": {
      const bufferData = new Uint8Array(data);
      const contentIndex =
        indexOfUint8Array(bufferData, AUDIO_SEP) + AUDIO_SEP.length;
      const headers = new TextDecoder("utf-8").decode(
        bufferData.subarray(2, contentIndex),
      );
      const payload = bufferData.subarray(contentIndex);
      const requestId = parseRequestId(headers);
      logger.debug(
        { requestId },
        `Received binary data: ${formatSize(payload)}`,
      );

      return { requestId, data: bufferData.subarray(contentIndex) };
    }
  }
}

export class Service {
  private ws: IsomorphicWebSocket | null = null;

  /**
   * The timer id to close the connection to microsoft server
   *
   * After some time of no user request, we will close the connection to microsoft server
   */
  private timerId: ReturnType<typeof setTimeout> | undefined = undefined;

  private requestMap = new Map<string, SynthesisRequest>();

  constructor() {
    this.requestMap = new Map();
  }

  private reset() {
    this.ws = null;
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = undefined;
    }
    this.requestMap.clear();
  }

  private async connect(): Promise<void> {
    const [url, headers] = await getURLAndHeaders();
    logger.info("Starting websocket connection to Microsoft server...");

    const ws = await connect({ url, headers });
    this.ws = ws;
    logger.info("Connected to Microsoft server");

    ws.addEventListener("close", (closeEvent) => {
      // 服务器会自动断开空闲超过30秒的连接
      const { code, reason } = closeEvent;
      for (const [id, request] of this.requestMap) {
        request.errorCallback(
          new Error(`Connection Closed for ${id}. ${reason} ${code}`),
        );
      }
      this.reset();
      logger.info(`Connection Closed： reason: ${reason} code: ${code}`);
    });

    ws.addEventListener("message", (message) => {
      const result = handleMessage(message);
      if (result == null) {
        logger.debug("Received unrecognized message");
        return;
      }
      const { requestId, data } = result;
      if (requestId == null) {
        logger.debug("Received unrecognized message");
        return;
      }
      const request = this.requestMap.get(requestId);
      if (request) {
        typeof data === "string"
          ? request.handleString(data)
          : request.handleBuffer(data);
      } else {
        logger.debug("Received message for unknown request");
        return;
      }
    });

    ws.addEventListener("error", (event) => {
      logger.error(`Connection error: ${event.message}`);
      if (this.ws) {
        this.ws.close();
        for (const [id, request] of this.requestMap) {
          request.errorCallback(
            new Error(`Connection failed：${id} ${event.message}`),
          );
        }
      }
    });
  }

  public async convert(ssml: string, format: string) {
    let perfConnect: number | undefined = undefined;
    if (this.ws == null || this.ws.readyState !== WS_OPEN) {
      const perfConnStart = performance.now();
      await this.connect();
      perfConnect = performance.now() - perfConnStart;
    }

    const perfConvertStart = performance.now();

    const requestId = randomUUID().toLowerCase();
    const reqLogger = logger.child({ requestId });
    const result = new Promise<Uint8Array>((resolve, reject) => {
      const request = new SynthesisRequest(
        requestId,
        resolve,
        reject,
        reqLogger,
      );
      this.requestMap.set(requestId, request);
      reqLogger.info("Received user request");
      reqLogger.debug({ ssml }, "User provided SSML");
      // 发送配置消息
      // biome-ignore lint/style/noNonNullAssertion: ws should be initialized above
      request.send(ssml, format, (data) => this.ws!.send(data));
    });
    // 收到请求，清除超时定时器
    if (this.timerId) {
      logger.debug("Received request, clearing timeout timer");
      clearTimeout(this.timerId);
      this.timerId = undefined;
    }
    // 设置定时器，超过10秒没有收到请求，主动断开连接
    logger.debug("Creating timeout timer for closing connection");
    this.timerId = setTimeout(() => {
      if (this.ws && this.ws.readyState === WS_OPEN) {
        this.ws.close(1000);
        logger.debug("Connection Closed by client due to inactivity");
        this.timerId = undefined;
      }
    }, 10000);

    const data = await Promise.race([
      result,
      new Promise<never>((_, reject) => {
        // 如果超过 20 秒没有返回结果，则清除请求并返回超时
        setTimeout(() => {
          reject("Convert timeout");
        }, 10000);
      }),
    ]);
    this.requestMap.delete(requestId);

    const perfConvert = performance.now() - perfConvertStart;
    reqLogger.info(
      `Convert Complete (connect: ${perfConnect ? `${perfConnect.toFixed(2)}ms` : "reused"}, convert: ${perfConvert.toFixed(2)}ms, data: ${formatSize(data)})`,
    );
    reqLogger.debug(`${this.requestMap.size} tasks remaining`);
    return data;
  }
}

function randomUUID() {
  return crypto.randomUUID().replaceAll("-", "");
}

function concatenate(uint8arrays: Uint8Array[]) {
  const totalLength = uint8arrays.reduce(
    (total, uint8array) => total + uint8array.byteLength,
    0,
  );

  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const uint8array of uint8arrays) {
    result.set(uint8array, offset);
    offset += uint8array.byteLength;
  }

  return result;
}

function indexOfUint8Array(buffer: Uint8Array, separator: number[]) {
  if (separator.length === 0) {
    return 0;
  }

  const len = buffer.length - separator.length;
  let i = 0;

  outer: while (i <= len) {
    if (buffer[i] === separator[0]) {
      for (let j = 1; j < separator.length; j++) {
        if (buffer[i + j] !== separator[j]) {
          i++;
          continue outer;
        }
      }
      return i;
    }
    i++;
  }
  return -1;
}

function formatSize(uint8Array: Uint8Array) {
  const bytes = uint8Array.byteLength;
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(2)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
