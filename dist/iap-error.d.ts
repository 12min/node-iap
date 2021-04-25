import { ReceiptStatus } from './lib/apple';
export declare type ErrorType = 'INVALID_INPUT' | 'APPSTORE_ERROR' | 'GOOGLEPLAY_ERROR';
export interface ErrorMeta {
    field?: string;
    appleStatus?: ReceiptStatus;
    error?: Error;
}
export default class IapError extends Error {
    type: ErrorType;
    meta?: ErrorMeta;
    constructor(type: ErrorType, message?: string, meta?: ErrorMeta);
}
