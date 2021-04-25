import { Payment, Receipt } from '../..';
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
export default function verifyPayment(payment: Payment): Promise<Receipt>;
