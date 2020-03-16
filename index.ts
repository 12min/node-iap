import apple, { AppleReceiptResponse } from './lib/apple';
import google, { GoogleReceiptResponse } from './lib/google';
import amazon, { AmazonReceiptResponse } from './lib/amazon';
import roku, { RokuReceiptResponse } from './lib/roku';

const engine = { apple, google, amazon, roku };

export type Platform = 'google' | 'apple' | 'amazon' | 'roku';

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
  /**
   * Amazon user ID
   */
  userId?: string;
  /**
   * Roku's developer token
   */
  devToken?: string;
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
  originalReceiptObject?:
    AppleReceiptResponse |
    GoogleReceiptResponse |
    AmazonReceiptResponse |
    RokuReceiptResponse;
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
export default function verifyPayment(platform: Platform, payment: Payment): Promise<Receipt> {
  return engine[platform](payment);
}
