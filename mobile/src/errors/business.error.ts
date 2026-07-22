
export abstract class BaseError<T> extends Error {
  constructor(
    message: string,
    public readonly context: T,
  ) {
    super(message);
  }
}
