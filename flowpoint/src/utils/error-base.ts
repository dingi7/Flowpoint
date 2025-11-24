export class ErrorBase<T extends string> extends Error {
  public readonly code: T;
  public readonly message: string;
  public readonly customData?: Record<string, unknown>;

  constructor(code: T, message: string, customData?: Record<string, unknown>) {
    super(message);
    this.code = code;
    this.message = message;
    this.customData = customData;
  }
}
