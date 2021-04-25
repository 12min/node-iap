import { Payment, Receipt } from '../..';
/**
 * The receipt status describes a valid receipt or gives
 * you an error code in order to you to revalidate what is
 * wrong with your receipt.
 *
 * @see https://developer.apple.com/library/archive/releasenotes/General/ValidateAppStoreReceipt/Chapters/ValidateRemotely.html#//apple_ref/doc/uid/TP40010573-CH104-SW5
 */
export declare type ReceiptStatus = 0 | 21000 | 21002 | 21003 | 21004 | 21005 | 21006 | 21007 | 21008 | 21009 | 21010;
declare type ReceiptEnvironment = 'Production' | 'Sandbox';
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
/**
 * Verify a payment object and returns it's receipt.
 *
 * @param {Payment} payment A payment object with the base64 receipt string
 *                          and the Apple API secret.
 *
 * @returns {Promise<Receipt>} Resolves to a processable receipt.
 */
export default function verifyPayment(payment: Payment): Promise<Receipt>;
export {};
