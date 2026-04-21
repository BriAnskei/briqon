export class RetryHandler {
  attempt = 0;
  constructor(private readonly maxRetry: number) {}

  shouldRetry() {
    return this.attempt < this.maxRetry;
  }

  next() {
    this.attempt++;
  }
}
