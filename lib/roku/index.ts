import request from 'request-promise-native';
import { Payment, Receipt } from '../..';
import { invariantPromise as invariant } from '../util';

export interface RokuReceiptResponse {
    errorCode: number | null;
    errorDetails: object;
    errorMessage: string;
    status: number;
    OriginalTransactionId: string;
    amount: number;
    cancelled: boolean;
    channelId: number;
    channelName: string;
    couponCode: string | null;
    creditsApplied: object | null;
    currency: string;
    expirationDate: string;
    isEntitled: boolean;
    originalPurchaseDate: string;
    partnerReferenceId: number | null;
    productId: string;
    productName: string;
    purchaseDate: string;
    quantity: number;
    rokuCustomerId: string;
    tax: number;
    total: number;
    transactionId: string;
}

function buildURL(payment: Payment): string {
  return `https://apipub.roku.com/listen/transaction-service.svc/validate-transaction/${payment.devToken}/${payment.receipt}`;
}

function parseReceipt(receipt: RokuReceiptResponse): Receipt {
  return {
    transactionId: receipt.transactionId,
    productId: receipt.productId,
    purchaseDate: new Date(parseInt(receipt.purchaseDate.substr(6, 13), 10)),
    expirationDate: receipt.expirationDate
      ? new Date(parseInt(receipt.expirationDate.substr(6, 13), 10))
      : null,
    originalReceiptObject: receipt,
  };
}

function validateReceipt(receipt: RokuReceiptResponse): RokuReceiptResponse {
  if (receipt.errorMessage !== '') {
    throw new Error(receipt.errorMessage);
  }

  return receipt;
}

export default function verifyPayment(payment: Payment): Promise<Receipt> {
  return Promise.all([
    invariant(typeof payment.devToken === 'string', 'devToken must be a string'),
    invariant(typeof payment.receipt === 'string', 'receipt must be a string'),
    invariant(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/.test(payment.receipt), 'receipt does not follow the expected format, eg (6ccb40bf-bd7a-49dc-9846-aafd01890ba5).'),
  ])
    .then(() => buildURL(payment))
    .then((url) => request.get(url, { json: true }))
    .then(validateReceipt)
    .then(parseReceipt);
}
