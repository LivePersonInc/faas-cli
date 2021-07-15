import { TransformCallback, Transform } from 'stream';

export class LogsTransform extends Transform {
  private shouldWrite: boolean;

  constructor(removeHeader = false) {
    super();
    this.shouldWrite = !removeHeader;
  }

  // eslint-disable-next-line no-underscore-dangle
  public _transform(
    chunk: string,
    _: string,
    callback: TransformCallback,
  ): void {
    if (this.shouldWrite) {
      process.stdout.write(chunk);
    } else {
      const buffer = chunk.toString();
      if (buffer.includes('\n')) {
        process.stdout.write(buffer.slice(buffer.indexOf('\n') + 1));
        this.shouldWrite = true;
      }
    }
    callback();
  }
}
