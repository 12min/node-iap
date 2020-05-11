import apple, { AppleReceiptResponse } from './lib/apple';
import google, { GoogleReceiptResponse } from './lib/google';

export { default as IapError } from './iap-error';

const engine = { apple, google };

export type Platform = 'google' | 'apple';

export interface Payment {
  /**
   * The receipt code. A base64 string for Apple or the purchase token
   * for Google.
   */
  receipt: string;
  /**
   * Apple's API password.
   */
  secret?: string;
  /**
   * Apple's `exclude-old-transactions` parameter.
   */
  excludeOldTransactions?: boolean;
  /**
   * The product ID associated with the receipt.
   */
  productId?: string;
  /**
   * The Android package name or the iOS bundle ID.
   */
  packageName?: string;
  /**
   * The Google service account key file (JSON).
   */
  keyFile?: string;
  /**
   * Set to true when it's a Google subscription.
   */
  subscription?: boolean;
}

/**
 * A unique interface to validate the user's receipt.
 */
export interface Receipt {
  productId: string;
  packageName?: string;
  transactionId: string;
  purchaseDate: Date;
  expirationDate: Date | null;
  originalReceiptObject?: AppleReceiptResponse | GoogleReceiptResponse;
}

/**
 * Verify the receipt for a specific platform.
 *
 * @param {Platform} platform - The platform of the receipt (google, apple, etc).
 * @param {Payment} payment - The payment object, containing the receipt and the
 *                            proper credentials to validate it.
 *
 * @returns {Promise<Receipt>}
 */
export function verifyPayment(platform: Platform, payment: Payment): Promise<Receipt> {
  return engine[platform](payment);
}
