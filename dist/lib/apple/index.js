"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var request_promise_native_1 = __importDefault(require("request-promise-native"));
var invariant_1 = __importDefault(require("invariant"));
var iap_error_1 = __importDefault(require("../../iap-error"));
var appleAPI = {
    sandbox: 'https://sandbox.itunes.apple.com/verifyReceipt',
    production: 'https://buy.itunes.apple.com/verifyReceipt',
};
var responseCodes = {
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
/**
 * Makes the direct request to the App Store to validate the receipt.
 *
 * @param {APIPaymentBody} data The request body that will be sent to the server.
 *
 * @returns {Promise<ReceiptResponse>}
 */
function sendAPIRequest(data) {
    return __awaiter(this, void 0, void 0, function () {
        var response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, request_promise_native_1.default.post(appleAPI.production, { json: data })];
                case 1:
                    response = _a.sent();
                    if (response.status === 21007) {
                        return [2 /*return*/, request_promise_native_1.default.post(appleAPI.sandbox, { json: data })];
                    }
                    return [2 /*return*/, response];
            }
        });
    });
}
/**
 * Returns the receipt with the oldest purchase date.
 *
 * @param {InAppPurchase[]} receipts The `in_app` field on ReceiptResponse.receipt
 *
 * @returns {InAppPurchase | undefined} Returns undefined if the list is empty
 */
function getLatestReceipt(receipts) {
    return receipts.reduce(function (cur, acc) {
        if (typeof cur != 'undefined' && typeof acc != 'undefined') {
            var curPurchaseTime = parseInt(cur.purchase_date_ms, 10);
            var accPurchaseTime = parseInt(acc.purchase_date_ms, 10);
            return curPurchaseTime > accPurchaseTime ? cur : acc;
        }
        if (typeof acc != 'undefined') {
            return acc;
        }
        return undefined;
    }, undefined);
}
/**
 * Verify the receipt object against some constraints
 *
 * @param {Payment} payment The payment object passed to `verifyPayment`
 * @param {ReceiptResponse} receipt The receipt object returned from Apple servers
 *
 * @returns {ReceiptResponse} The same unmodified receipt object
 */
function verifyReceipt(payment, receipt) {
    if (receipt.receipt !== undefined && receipt.receipt.in_app !== undefined) {
        var latestReceipt = getLatestReceipt(receipt.receipt.in_app);
        if (payment.productId !== undefined && latestReceipt.product_id !== payment.productId) {
            throw new iap_error_1.default('INVALID_INPUT', "Wrong product id: " + payment.productId + ", expected: " + latestReceipt.product_id, { field: 'productId' });
        }
    }
    if (payment.packageName !== undefined && receipt.receipt.bundle_id !== payment.packageName) {
        throw new iap_error_1.default('INVALID_INPUT', "Wrong package name: " + payment.packageName + ", expected: " + receipt.receipt.bundle_id, { field: 'packageName' });
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
function parseReceipt(receipt) {
    var latestReceipt = getLatestReceipt(receipt.receipt.in_app);
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
function verifyPayment(payment) {
    return __awaiter(this, void 0, void 0, function () {
        var paymentBody, response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    paymentBody = {
                        'receipt-data': payment.receipt,
                        password: payment.secret,
                        'exclude-old-transactions': payment.excludeOldTransactions,
                    };
                    invariant_1.default(typeof payment.receipt === 'string', 'Receipt must be a string');
                    invariant_1.default(typeof payment.secret === 'string', 'Secret must be a string');
                    invariant_1.default(payment.excludeOldTransactions === undefined
                        || typeof payment.excludeOldTransactions === 'boolean', 'excludeOldTransactions must be a boolean');
                    return [4 /*yield*/, sendAPIRequest(paymentBody)];
                case 1:
                    response = _a.sent();
                    if (response.status !== 0 && response.status !== 21006) {
                        throw new iap_error_1.default('APPSTORE_ERROR', responseCodes[response.status], { appleStatus: response.status });
                    }
                    return [2 /*return*/, parseReceipt(verifyReceipt(payment, response))];
            }
        });
    });
}
exports.default = verifyPayment;
//# sourceMappingURL=index.js.map