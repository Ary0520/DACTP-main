"use strict";
/**
 * Example: Integrating DACTP into a DEX Protocol
 *
 * This example shows how a DEX like StellarDEX can use DACTP
 * for reputation-based trading limits and margin trading.
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
exports.StellarDEXIntegration = void 0;
exports.exampleDEXUsage = exampleDEXUsage;
const DACTP_1 = require("../core/DACTP");
class StellarDEXIntegration {
    constructor(network = 'futurenet') {
        this.dactp = new DACTP_1.DACTP({ network });
    }
    /**
     * Check if trader can execute a trade with given amount
     */
    canExecuteTrade(trader_1, tradeAmount_1) {
        return __awaiter(this, arguments, void 0, function* (trader, tradeAmount, tradeType = 'spot') {
            try {
                const reputation = yield this.dactp.reputation.getScore(trader);
                const tier = reputation.tier;
                // Different limits for different trade types
                let maxTradeAmount;
                let leverageAllowed = 1; // No leverage by default
                if (tradeType === 'spot') {
                    // Spot trading limits based on reputation tier
                    maxTradeAmount = this.getSpotTradingLimit(tier.tier);
                }
                else {
                    // Margin trading requires higher reputation
                    if (reputation.score < 70) {
                        return {
                            canTrade: false,
                            reason: 'Margin trading requires reputation score of 70+',
                            maxAllowed: 0
                        };
                    }
                    maxTradeAmount = this.getMarginTradingLimit(tier.tier);
                    leverageAllowed = this.getAllowedLeverage(tier.tier);
                }
                if (tradeAmount > maxTradeAmount) {
                    return {
                        canTrade: false,
                        reason: `Trade amount exceeds ${tier.name} tier limit`,
                        maxAllowed: maxTradeAmount
                    };
                }
                return {
                    canTrade: true,
                    maxAllowed: maxTradeAmount,
                    leverageAllowed
                };
            }
            catch (error) {
                return {
                    canTrade: false,
                    reason: `Trade check failed: ${error.message}`
                };
            }
        });
    }
    /**
     * Execute trade and update reputation based on outcome
     */
    executeTrade(trader_1, tradeAmount_1, tradeType_1) {
        return __awaiter(this, arguments, void 0, function* (trader, tradeAmount, tradeType, leverage = 1) {
            try {
                // Check if trade is allowed
                const canTrade = yield this.canExecuteTrade(trader, tradeAmount, tradeType);
                if (!canTrade.canTrade) {
                    return {
                        success: false
                    };
                }
                // Simulate trade execution
                const tradeResult = yield this.simulateTradeExecution(trader, tradeAmount, tradeType, leverage);
                // Update reputation based on trade outcome
                let reputationDelta = 0;
                if (tradeResult.profitable) {
                    reputationDelta = tradeType === 'margin' ? 3 : 2; // Higher reward for margin
                }
                else {
                    reputationDelta = tradeResult.majorLoss ? -10 : -2; // Penalty for losses
                }
                // Apply reputation update (unsigned for now)
                yield this.dactp.updateReputation('DEX_PROTOCOL_ADDRESS', trader, reputationDelta, { signAndSend: false });
                return {
                    success: true,
                    tradeId: tradeResult.tradeId,
                    reputationDelta
                };
            }
            catch (error) {
                console.error('Trade execution failed:', error);
                return { success: false };
            }
        });
    }
    /**
     * Get trader's profile with trading limits
     */
    getTraderProfile(trader) {
        return __awaiter(this, void 0, void 0, function* () {
            const reputation = yield this.dactp.reputation.getScore(trader);
            const tier = reputation.tier;
            return {
                reputation: reputation.score,
                tier: tier.name,
                spotTradingLimit: this.getSpotTradingLimit(tier.tier),
                marginTradingLimit: this.getMarginTradingLimit(tier.tier),
                maxLeverage: this.getAllowedLeverage(tier.tier),
                canMarginTrade: reputation.score >= 70
            };
        });
    }
    /**
     * Handle liquidation and apply reputation penalty
     */
    handleLiquidation(trader, liquidationAmount) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Heavy penalty for getting liquidated
                const penalty = liquidationAmount > 1000 ? -15 : -10;
                yield this.dactp.updateReputation('DEX_PROTOCOL_ADDRESS', trader, penalty, { signAndSend: false });
                console.log(`Applied ${penalty} reputation penalty for liquidation`);
            }
            catch (error) {
                console.error('Liquidation handling failed:', error);
            }
        });
    }
    // Private helper methods
    getSpotTradingLimit(tier) {
        const limits = [0, 100, 500, 2000, 10000]; // XLM limits per tier
        return limits[tier] || 0;
    }
    getMarginTradingLimit(tier) {
        const limits = [0, 0, 200, 1000, 5000]; // XLM limits per tier (margin)
        return limits[tier] || 0;
    }
    getAllowedLeverage(tier) {
        const leverage = [1, 1, 2, 5, 10]; // Max leverage per tier
        return leverage[tier] || 1;
    }
    simulateTradeExecution(trader, amount, type, leverage) {
        return __awaiter(this, void 0, void 0, function* () {
            // Simulate trade outcome (in real implementation, this would be actual trading logic)
            const profitable = Math.random() > 0.4; // 60% chance of profit
            const majorLoss = !profitable && Math.random() > 0.8; // 20% chance of major loss
            return {
                tradeId: `trade_${Date.now()}`,
                profitable,
                majorLoss
            };
        });
    }
}
exports.StellarDEXIntegration = StellarDEXIntegration;
// Usage example
function exampleDEXUsage() {
    return __awaiter(this, void 0, void 0, function* () {
        const dex = new StellarDEXIntegration('futurenet');
        // Check if user can margin trade
        const canTrade = yield dex.canExecuteTrade('GBJNTJ56V23KNAG4LBPKLQRVC4GSJ75ICBFQYNI4TQBHQNAYZK4SE7ON', 1000, // 100 XLM
        'margin');
        console.log('Can Trade:', canTrade);
        // Get trader profile
        const profile = yield dex.getTraderProfile('GBJNTJ56V23KNAG4LBPKLQRVC4GSJ75ICBFQYNI4TQBHQNAYZK4SE7ON');
        console.log('Trader Profile:', profile);
    });
}
//# sourceMappingURL=dex-integration.js.map