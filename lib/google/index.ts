import request from 'request-promise-native';
import { StatusCodeError } from 'request-promise-native/errors';
import {
  parseKeyFile, generateJWTToken, requestToken, generateURL,
} from './credentials';
import invariant from 'invariant';
import { Payment, Receipt } from '../..';
import IapError from '../../iap-error';

export interface GoogleReceiptResponse {
  kind: string;
  startTimeMillis: string;
  expiryTimeMillis: string;
  autoRenewing: boolean;
  priceCurrencyCode: string;
  priceAmountMicros: string;
  countryCode: string;
  developerPayload: string;
  paymentState: number;
  orderId: string;
  purchaseType: number;
  acknowledgementState: number;
}

function parseReceipt(payment: Payment, receipt: GoogleReceiptResponse): Receipt {
  return {
    packageName: payment.packageName!,
    productId: payment.productId!,
    transactionId: receipt.orderId,
    purchaseDate: new Date(parseInt(receipt.startTimeMillis, 10)),
    expirationDate: new Date(parseInt(receipt.expiryTimeMillis, 10)),
    originalReceiptObject: receipt,
  };
}

function handleRequestError(err: Error) {
  if (err.name !== 'StatusCodeError' || !((err as StatusCodeError).statusCode >= 400)) {
    throw err;
  }


  throw new IapError('GOOGLEPLAY_ERROR', err.message, { error: err });
}

export default async function verifyPayment(payment: Payment): Promise<Receipt> {
  invariant(typeof payment.packageName === 'string', 'Package name must be a string');
  invariant(typeof payment.productId === 'string', 'Product ID must be a string');
  invariant(typeof payment.receipt === 'string', 'Receipt must be a string');
  invariant(typeof payment.keyFile === 'string', 'Key file must be present');

  const keyObject = await parseKeyFile(payment.keyFile);

  const jwtToken = generateJWTToken(keyObject);
  const token = await requestToken(keyObject, jwtToken);

  const response = await request.get({
    uri: generateURL(payment, token),
    json: true,
  }).catch(handleRequestError);

  return parseReceipt(payment, response);
}
