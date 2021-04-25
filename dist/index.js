"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var apple_1 = __importDefault(require("./lib/apple"));
var google_1 = __importDefault(require("./lib/google"));
var iap_error_1 = require("./iap-error");
exports.IapError = iap_error_1.default;
var engine = { apple: apple_1.default, google: google_1.default };
/**
 * Verify the receipt for a specific platform.
 *
 * @param {Platform} platform - The platform of the receipt (google, apple, etc).
 * @param {Payment} payment - The payment object, containing the receipt and the
 *                            proper credentials to validate it.
 *
 * @returns {Promise<Receipt>}
 */
function verifyPayment(platform, payment) {
    return engine[platform](payment);
}
exports.verifyPayment = verifyPayment;
//# sourceMappingURL=index.js.map