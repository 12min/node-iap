import { ReceiptStatus } from './lib/apple';

export type ErrorType = 'INVALID_INPUT' | 'APPSTORE_ERROR';

export interface ErrorMeta {
  field?: string;
  appleStatus?: ReceiptStatus;
}

export default class IapError extends Error {
  public type: ErrorType;
  public meta?: ErrorMeta;

  constructor(type: ErrorType, message?: string, meta?: ErrorMeta) {
    super(message);
    this.type = type;
    this.meta = meta;
  }
}
