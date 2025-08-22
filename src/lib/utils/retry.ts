export class RetryError extends Error {
  public cause: unknown[];

  constructor(message: string, cause: unknown[]) {
    super(message);
    this.cause = cause;
  }
}

const retry = async <T>(
  fn: () => Promise<T>,
  times: number,
  errorFn?: (index: number, error: unknown, abort: () => void) => void,
  failedMessage = "Failed after multiple attempts",
): Promise<T> => {
  let aborted = false;

  const attempt = async (remaining: number, errors: unknown[]): Promise<T> => {
    if (remaining === 0 || aborted) {
      throw new RetryError(failedMessage, errors);
    }

    try {
      return await fn();
    } catch (error) {
      if (errorFn) {
        errorFn(times - remaining, error, () => {
          aborted = true;
        });
      }
      return attempt(remaining - 1, [...errors, error]);
    }
  };

  return attempt(times, []);
};

export default retry;
