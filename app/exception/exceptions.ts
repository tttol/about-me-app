export class CreateItemException extends Error {
  public readonly name: string;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype); // instanceofの動作を保証する
    Error.captureStackTrace(this, this.constructor); // スタックトレースを生成
  }
}
