"use strict";
/**
 * Reputation Manager - Handles reputation scoring, tiers, and updates
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
exports.ReputationManager = void 0;
const Reputation_1 = require("../types/Reputation");
const Common_1 = require("../types/Common");
class ReputationManager {
    constructor(stellar) {
        this.stellar = stellar;
    }
    /**
     * Get reputation score for an agent
     */
    getScore(agentAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const score = yield this.stellar.simulateCall(this.stellar.contracts.reputationManager, 'get_score', [agentAddress]);
                const numericScore = typeof score === 'number' ? score : 50; // Default score
                const tier = this.getTier(numericScore);
                return {
                    score: numericScore,
                    tier,
                    lastUpdated: Date.now()
                };
            }
            catch (error) {
                // Return default score if agent not found
                const tier = this.getTier(50);
                return {
                    score: 50,
                    tier,
                    lastUpdated: Date.now()
                };
            }
        });
    }
    /**
     * Update an agent's reputation score
     */
    updateScore(params_1) {
        return __awaiter(this, arguments, void 0, function* (params, options = {}) {
            try {
                const args = [params.caller, params.agent, params.delta];
                if (options.signAndSend === false) {
                    const tx = yield this.stellar.buildContractTx(params.caller, this.stellar.contracts.reputationManager, 'update_score', args);
                    return {
                        hash: tx.toXDR(),
                        success: true
                    };
                }
                throw new Common_1.DACTPError('Wallet signing not implemented yet. Use signAndSend: false to get unsigned XDR.', Common_1.ErrorCodes.WALLET_ERROR);
            }
            catch (error) {
                throw new Common_1.DACTPError(`Reputation update failed: ${error.message}`, Common_1.ErrorCodes.CONTRACT_ERROR, error);
            }
        });
    }
    /**
     * Get reputation tier for a given score
     */
    getTier(score) {
        for (const tier of Reputation_1.REPUTATION_TIERS) {
            if (score >= tier.minScore && score <= tier.maxScore) {
                return tier;
            }
        }
        // Fallback to lowest tier
        return Reputation_1.REPUTATION_TIERS[0];
    }
    /**
     * Get maximum loan amount for a reputation score
     */
    getMaxLoanAmount(score) {
        const tier = this.getTier(score);
        return tier.maxLoanAmount;
    }
    /**
     * Check if score qualifies for a specific tier
     */
    qualifiesForTier(score, targetTier) {
        const tier = this.getTier(score);
        return tier.tier >= targetTier;
    }
    /**
     * Get all available reputation tiers
     */
    getAllTiers() {
        return [...Reputation_1.REPUTATION_TIERS];
    }
    /**
     * Calculate reputation delta for common actions
     */
    getReputationDelta(action) {
        return Reputation_1.REPUTATION_DELTAS[action];
    }
    /**
     * Predict new score after applying delta
     */
    predictNewScore(currentScore, delta) {
        const newScore = Math.max(0, Math.min(100, currentScore + delta));
        const tier = this.getTier(newScore);
        return {
            score: newScore,
            tier,
            lastUpdated: Date.now()
        };
    }
    /**
     * Check if an agent has sufficient reputation for an action
     */
    hasMinimumReputation(agentAddress, minimumScore) {
        return __awaiter(this, void 0, void 0, function* () {
            const reputation = yield this.getScore(agentAddress);
            return reputation.score >= minimumScore;
        });
    }
    /**
     * Get reputation level name (for display purposes)
     */
    getReputationLevel(score) {
        const tier = this.getTier(score);
        return tier.name;
    }
    /**
     * Get reputation color (for UI purposes)
     */
    getReputationColor(score) {
        const tier = this.getTier(score);
        return tier.color;
    }
}
exports.ReputationManager = ReputationManager;
//# sourceMappingURL=ReputationManager.js.map