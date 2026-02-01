"use strict";
/**
 * Common types used throughout the DACTP SDK
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorCodes = exports.DACTPError = void 0;
class DACTPError extends Error {
    constructor(message, code, details) {
        super(message);
        this.code = code;
        this.details = details;
        this.name = 'DACTPError';
    }
}
exports.DACTPError = DACTPError;
var ErrorCodes;
(function (ErrorCodes) {
    ErrorCodes["NETWORK_ERROR"] = "NETWORK_ERROR";
    ErrorCodes["CONTRACT_ERROR"] = "CONTRACT_ERROR";
    ErrorCodes["VALIDATION_ERROR"] = "VALIDATION_ERROR";
    ErrorCodes["WALLET_ERROR"] = "WALLET_ERROR";
    ErrorCodes["UNAUTHORIZED"] = "UNAUTHORIZED";
    ErrorCodes["INSUFFICIENT_REPUTATION"] = "INSUFFICIENT_REPUTATION";
})(ErrorCodes || (exports.ErrorCodes = ErrorCodes = {}));
//# sourceMappingURL=Common.js.map