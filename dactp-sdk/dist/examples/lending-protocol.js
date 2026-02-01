"use strict";
/**
 * Example: Integrating DACTP into a Lending Protocol
 *
 * This example shows how a lending protocol like StellarLend
 * can integrate DACTP for reputation-based lending limits.
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StellarLendIntegration = void 0;
exports.exampleUsage = exampleUsage;
const DACTP_1 = require("../core/DACTP");
class StellarLendIntegration {
    constructor(network = 'futurenet') {
        this.dactp = new DACTP_1.DACTP({ network });
    }
    /**
     * Process a loan request with DACTP reputation checks
     */
    processLoanRequest(borrower_1, amount_1) {
        return __awaiter(this, arguments, void 0, function* (borrower, amount, durationDays = 30) {
            try {
                // Step 1: Check if borrower can perform borrow action
                const canBorrow = yield this.dactp.canPerformAction(borrower, 'borrow', amount, 60 // Minimum reputation of 60 required
                );
                if (!canBorrow.canPerform) {
                    return {
                        approved: false,
                        reason: canBorrow.reason,
                        maxAllowed: canBorrow.maxAllowed
                    };
                }
                // Step 2: Calculate reputation-based interest rate
                const reputation = canBorrow.currentReputation;
                const interestRate = this.calculateInterestRate(reputation);
                // Step 3: Additional business logic checks
                const businessChecks = yield this.performBusinessChecks(borrower, amount);
                if (!businessChecks.passed) {
                    return {
                        approved: false,
                        reason: businessChecks.reason
                    };
                }
                return {
                    approved: true,
                    interestRate,
                    maxAllowed: canBorrow.maxAllowed
                };
            }
            catch (error) {
                return {
                    approved: false,
                    reason: `Loan processing failed: ${error.message}`
                };
            }
        });
    }
    /**
     * Handle loan repayment and update reputation
     */
    processLoanRepayment(borrower_1, loanId_1) {
        return __awaiter(this, arguments, void 0, function* (borrower, loanId, isEarlyPayment = false, isLatePayment = false) {
            try {
                // Determine reputation delta based on payment timing
                let reputationDelta = 8; // On-time payment
                if (isEarlyPayment) {
                    reputationDelta = 12; // Early payment bonus
                }
                else if (isLatePayment) {
                    reputationDelta = -5; // Late payment penalty
                }
                // Update reputation (in real implementation, you'd sign this transaction)
                yield this.dactp.updateReputation('LENDING_PROTOCOL_ADDRESS', // Your protocol's address
                borrower, reputationDelta, { signAndSend: false } // Get unsigned XDR for now
                );
                return {
                    success: true,
                    reputationDelta
                };
            }
            catch (error) {
                console.error('Repayment processing failed:', error);
                return {
                    success: false,
                    reputationDelta: 0
                };
            }
        });
    }
    /**
     * Handle loan default and apply heavy reputation penalty
     */
    processLoanDefault(borrower, loanId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Apply heavy penalty for default
                yield this.dactp.updateReputation('LENDING_PROTOCOL_ADDRESS', borrower, -25, // Heavy penalty
                { signAndSend: false });
                console.log(`Applied -25 reputation penalty to ${borrower} for loan default`);
            }
            catch (error) {
                console.error('Default processing failed:', error);
            }
        });
    }
    /**
     * Get borrower's lending profile
     */
    getBorrowerProfile(borrower) {
        return __awaiter(this, void 0, void 0, function* () {
            const reputation = yield this.dactp.reputation.getScore(borrower);
            const maxLoanAmount = yield this.dactp.getMaxLoanAmount(borrower);
            const estimatedInterestRate = this.calculateInterestRate(reputation.score);
            return {
                reputation: reputation.score,
                tier: reputation.tier.name,
                maxLoanAmount,
                estimatedInterestRate
            };
        });
    }
    /**
     * Calculate interest rate based on reputation
     * Higher reputation = lower interest rate
     */
    calculateInterestRate(reputation) {
        const baseRate = 0.12; // 12% base rate
        const reputationDiscount = Math.max(0, (reputation - 50) / 100); // Up to 50% discount
        return Math.max(0.05, baseRate * (1 - reputationDiscount)); // Minimum 5% rate
    }
    /**
     * Additional business logic checks
     */
    performBusinessChecks(borrower, amount) {
        return __awaiter(this, void 0, void 0, function* () {
            // Example business logic
            if (amount > 1000) {
                return {
                    passed: false,
                    reason: 'Amount exceeds protocol maximum'
                };
            }
            return { passed: true };
        });
    }
}
exports.StellarLendIntegration = StellarLendIntegration;
// Usage example
function exampleUsage() {
    return __awaiter(this, void 0, void 0, function* () {
        const lending = new StellarLendIntegration('futurenet');
        // Check if user can borrow
        const loanRequest = yield lending.processLoanRequest('GBJNTJ56V23KNAG4LBPKLQRVC4GSJ75ICBFQYNI4TQBHQNAYZK4SE7ON', 500 // 50 XLM
        );
        console.log('Loan Request Result:', loanRequest);
        // Get borrower profile
        const profile = yield lending.getBorrowerProfile('GBJNTJ56V23KNAG4LBPKLQRVC4GSJ75ICBFQYNI4TQBHQNAYZK4SE7ON');
        console.log('Borrower Profile:', profile);
    });
}
//# sourceMappingURL=lending-protocol.js.map