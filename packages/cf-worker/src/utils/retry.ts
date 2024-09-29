const retry = async <T>(
  fn: () => Promise<T>,
  times: number,
  errorFn?: (index: number, error: unknown) => void,
  failedMessage = "Failed after multiple attempts",
): Promise<T> => {
  const attempt = async (remaining: number, errors: unknown[]): Promise<T> => {
    if (remaining === 0) {
      throw { message: failedMessage, errors };
    }

    try {
      return await fn();
    } catch (error) {
      if (errorFn) {
        errorFn(times - remaining, error);
      }
      return attempt(remaining - 1, [...errors, error]);
    }
  };

  return attempt(times, []);
};

export default retry;
