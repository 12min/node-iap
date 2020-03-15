import request from 'request-promise-native';
import { Payment, Receipt } from "../..";
import { invariantPromise as invariant } from '../util';
import { Response } from 'request';

const baseURL = 'https://appstore-sdk.amazon.com/version/1.0/verifyReceiptId/developer/';

export interface AmazonReceiptResponse {
    purchaseDate: string;
    productId: string;
    renewalDate?: string;
    cancelDate?: string;
    receiptId: string;
}

function buildURL(payment: Payment): string {
    return `${baseURL}${payment.secret}/user/${payment.userId}/receiptId/${payment.receipt}`;
}

function parseResponse(receipt: AmazonReceiptResponse): Receipt {
    return {
        transactionId: receipt.receiptId,
        productId: receipt.productId,
        purchaseDate: new Date(parseInt(receipt.purchaseDate, 10)),
        expirationDate: new Date(parseInt(receipt.cancelDate ? receipt.cancelDate! : receipt.renewalDate!)),
        originalReceiptObject: receipt,
    };
}

function validateResponse(response: Response): AmazonReceiptResponse {
    if (response.statusCode === 400) {
        throw new Error('receipt is invalid, or no transaction was found for this receipt.')
    }

    if (response.statusCode === 496) {
        throw new Error('Invalid secret.')
    }

    if (response.statusCode === 497) {
        throw new Error('Invalid userId.')
    }

    return response.body
}

export default function verifyPayment(payment: Payment): Promise<Receipt> {
    return Promise.all([
        invariant(typeof payment.receipt === 'string', 'Receipt must be a string'),
        invariant(typeof payment.userId === 'string', 'User ID must be a string'),
        invariant(typeof payment.secret === 'string', 'Secret must be a string'),
    ])
    .then(() => request.get(buildURL(payment), { resolveWithFullResponse: true, json: true }))
    .then(validateResponse)
    .then(parseResponse);
}