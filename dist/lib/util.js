"use strict";
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var invariant_1 = __importDefault(require("invariant"));
function invariantPromise(
/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
testValue, format) {
    var extra = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        extra[_i - 2] = arguments[_i];
    }
    return new Promise(function (resolve, reject) {
        try {
            invariant_1.default.apply(void 0, __spreadArrays([testValue, format], extra));
            resolve();
        }
        catch (error) {
            reject(error);
        }
    });
}
exports.invariantPromise = invariantPromise;
//# sourceMappingURL=util.js.map