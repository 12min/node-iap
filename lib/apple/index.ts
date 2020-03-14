import request from 'request-promise-native';
import { invariantPromise as invariant } from '../util';
import { Payment, Receipt } from '../..';

const appleAPI = {
  sandbox: 'https://sandbox.itunes.apple.com/verifyReceipt',
  production: 'https://buy.itunes.apple.com/verifyReceipt',
};

/**
 * The receipt status describes a valid receipt or gives
 * you an error code in order to you to revalidate what is
 * wrong with your receipt.
 *
 * @see https://developer.apple.com/library/archive/releasenotes/General/ValidateAppStoreReceipt/Chapters/ValidateRemotely.html#//apple_ref/doc/uid/TP40010573-CH104-SW5
 */
type ReceiptStatus =
    0 | 21000 | 21002 | 21003 | 21004 | 21005 | 21006 | 21007 | 21008 | 21009 | 21010

const responseCodes: { [key: number]: string } = {
  21000: 'The App Store could not read the JSON object you provided.',
  21002: 'The data in the receipt-data property was malformed or missing.',
  21003: 'The receipt could not be authenticated.',
  21004: 'The shared secret you provided does not match the shared secret on file for your account.',
  21005: 'The receipt server is not currently available.',
  21006: 'This receipt is valid but the subscription has expired. When this status code is returned to your server, the receipt data is also decoded and returned as part of the response.',
  21007: 'This receipt is from the test environment, but it was sent to the production service for verification. Send it to the test environment service instead.',
  21008: 'This receipt is from the production receipt, but it was sent to the test environment service for verification. Send it to the production environment service instead.',
  21009: 'Internal data access error. Try again later.',
  21010: 'The user account cannot be found or has been deleted.',
};

type ReceiptEnvironment = 'Production' | 'Sandbox'

interface InAppPurchase {
  quantity: string;
  product_id: string;
  transaction_id: string;
  original_transaction_id: string;
  purchase_date: string;
  purchase_date_ms: string;
  purchase_date_pst: string;
  original_purchase_date: string;
  original_purchase_date_ms: string;
  original_purchase_date_pst: string;
  expires_date: string;
  expires_date_ms: string;
  expires_date_pst: string;
  web_order_line_item_id: string;
  is_trial_period: 'true' | 'false';
  is_in_intro_offer_period: 'true' | 'false';
  subscription_group_identifier: string;
}

/**
 * This interface represents the exact object as
 * is returned from Apple.
 *
 * @see https://developer.apple.com/library/archive/releasenotes/General/ValidateAppStoreReceipt/Chapters/ReceiptFields.html#//apple_ref/doc/uid/TP40010573-CH106-SW1
 */
export interface AppleReceiptResponse {
  status: ReceiptStatus;
  environment: ReceiptEnvironment;
  receipt: {
    receipt_type: ReceiptEnvironment;
    adam_id: number;
    app_item_id: number;
    bundle_id: string;
    application_version: string;
    download_id: number;
    version_external_identifier: number;
    receipt_creation_date: string;
    receipt_creation_date_ms: string;
    receipt_creation_date_pst: string;
    request_date: string;
    request_date_ms: string;
    request_date_pst: string;
    original_purchase_date: string;
    original_purchase_date_ms: string;
    original_purchase_date_pst: string;
    original_application_version: string;
    in_app: InAppPurchase[];
  };
  latest_receipt_info: InAppPurchase[];
  latest_receipt: string;
  pending_renewel_info: {
    auto_renew_product_id: string;
    original_transaction_id: string;
    product_id: string;
    auto_renew_status: string;
  };
}

interface APIPaymentBody {
  'receipt-data': string;
  password: string;
  'exclude-old-transactions'?: boolean;
}

/**
 * Makes the direct request to the App Store to validate the receipt.
 *
 * @param {APIPaymentBody} data The request body that will be sent to the server.
 *
 * @returns {Promise<ReceiptResponse>}
 */
function sendAPIRequest(data: APIPaymentBody): (() => Promise<AppleReceiptResponse>) {
  return (): Promise<AppleReceiptResponse> => request.post(appleAPI.production, { json: data })
    .then((response) => {
      if (response.status === 21007) {
        return request.post(appleAPI.sandbox, { json: data });
      }

      return response;
    });
}

/**
 * Returns the receipt with the oldest purchase date.
 *
 * @param {InAppPurchase[]} receipts The `in_app` field on ReceiptResponse.receipt
 *
 * @returns {InAppPurchase | undefined} Returns undefined if the list is empty
 */
function getLatestReceipt(receipts: InAppPurchase[]): InAppPurchase | undefined {
  return receipts.reduce((cur, acc) => {
    const curPurchaseTime = parseInt(cur.purchase_date_ms, 10);
    const accPurchaseTime = parseInt(acc.purchase_date_ms, 10);

    return curPurchaseTime > accPurchaseTime ? cur : acc;
  });
}

/**
 * Verify the receipt object against some constraints
 *
 * @param {Payment} payment The payment object passed to `verifyPayment`
 * @param {ReceiptResponse} receipt The receipt object returned from Apple servers
 *
 * @returns {ReceiptResponse} The same unmodified receipt object
 */
function verifyReceipt(payment: Payment, receipt: AppleReceiptResponse): AppleReceiptResponse {
  if (receipt.receipt !== undefined && receipt.receipt.in_app !== undefined) {
    const latestReceipt = getLatestReceipt(receipt.receipt.in_app)!;

    if (payment.productId !== undefined && latestReceipt.product_id !== payment.productId) {
      throw new Error(`Wrong product id: ${payment.productId}, expected: ${latestReceipt.product_id}`);
    }
  }

  if (payment.packageName !== undefined && receipt.receipt.bundle_id !== payment.packageName) {
    throw new Error(`Wrong package name: ${payment.packageName}, expected: ${receipt.receipt.bundle_id}`);
  }

  return receipt;
}

/**
 * Convert Apple's receipt object into a processable JavaScript object
 *
 * @param {ReceiptResponse} receipt Apple's raw receipt object
 *
 * @returns {Receipt} Processable receipt object
 */
function parseReceipt(receipt: AppleReceiptResponse): Receipt {
  const latestReceipt = getLatestReceipt(receipt.receipt.in_app)!;

  return {
    productId: latestReceipt.product_id,
    packageName: receipt.receipt.bundle_id,
    transactionId: latestReceipt.transaction_id,
    purchaseDate: new Date(parseInt(latestReceipt.purchase_date_ms, 10)),
    expirationDate: new Date(parseInt(latestReceipt.expires_date_ms, 10)),
    originalReceiptObject: receipt,
  };
}

/**
 * Verify a payment object and returns it's receipt.
 *
 * @param {Payment} payment A payment object with the base64 receipt string
 *                          and the Apple API secret.
 *
 * @returns {Promise<Receipt>} Resolves to a processable receipt.
 */
export default function verifyPayment(payment: Payment): Promise<Receipt> {
  const paymentBody: APIPaymentBody = {
    'receipt-data': payment.receipt,
    password: payment.secret!,
    'exclude-old-transactions': payment.excludeOldTransactions,
  };

  return Promise.all([
    invariant(typeof payment.receipt === 'string', 'Receipt must be a string'),
    invariant(typeof payment.secret === 'string', 'Secret must be a string'),
    invariant(
      payment.excludeOldTransactions === undefined
        || typeof payment.excludeOldTransactions === 'boolean',
      'excludeOldTransactions must be a boolean',
    ),
  ])
    .then(sendAPIRequest(paymentBody))
    .then((response: AppleReceiptResponse) => {
      if (response.status !== 0 && response.status !== 21006) {
        throw new Error(responseCodes[response.status]);
      }
      return response;
    })
    .then((receipt) => verifyReceipt(payment, receipt))
    .then(parseReceipt);
}
