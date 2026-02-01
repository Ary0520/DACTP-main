"use strict";
/**
 * Main DACTP SDK Class - The primary interface for all DACTP Protocol interactions
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
exports.DACTP = void 0;
const stellar_1 = require("../utils/stellar");
const AgentManager_1 = require("./AgentManager");
const ReputationManager_1 = require("./ReputationManager");
class DACTP {
    constructor(config = {}) {
        this.stellar = new stellar_1.StellarClient(config);
        this.agentManager = new AgentManager_1.AgentManager(this.stellar);
        this.reputationManager = new ReputationManager_1.ReputationManager(this.stellar);
    }
    // ==========================================
    // HIGH-LEVEL CONVENIENCE METHODS
    // ==========================================
    /**
     * One-line agent registration
     */
    registerAgent(owner_1, agent_1, scopes_1, maxAmount_1) {
        return __awaiter(this, arguments, void 0, function* (owner, agent, scopes, maxAmount, options = {}) {
            return this.agentManager.register({
                owner,
                agent,
                scopes,
                maxAmount
            }, options);
        });
    }
    /**
     * One-line authorization check
     */
    checkAuthorization(agent, action, amount) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.agentManager.isAuthorized({
                agent,
                action,
                amount
            });
            return result.authorized;
        });
    }
    /**
     * One-line reputation score retrieval
     */
    getReputationScore(agentAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            const reputation = yield this.reputationManager.getScore(agentAddress);
            return reputation.score;
        });
    }
    /**
     * One-line reputation update
     */
    updateReputation(caller_1, agent_1, delta_1) {
        return __awaiter(this, arguments, void 0, function* (caller, agent, delta, options = {}) {
            return this.reputationManager.updateScore({
                caller,
                agent,
                delta
            }, options);
        });
    }
    /**
     * Get maximum loan amount based on reputation
     */
    getMaxLoanAmount(agentAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            const score = yield this.getReputationScore(agentAddress);
            return this.reputationManager.getMaxLoanAmount(score);
        });
    }
    /**
     * Check if agent can perform action with amount (combines auth + reputation)
     */
    canPerformAction(agent_1, action_1, amount_1) {
        return __awaiter(this, arguments, void 0, function* (agent, action, amount, minimumReputation = 50) {
            try {
                // Check authorization first
                const authResult = yield this.agentManager.isAuthorized({
                    agent,
                    action,
                    amount
                });
                if (!authResult.authorized) {
                    return {
                        canPerform: false,
                        reason: authResult.reason || 'Not authorized'
                    };
                }
                // Check reputation
                const reputation = yield this.reputationManager.getScore(agent);
                if (reputation.score < minimumReputation) {
                    return {
                        canPerform: false,
                        reason: `Insufficient reputation. Required: ${minimumReputation}, Current: ${reputation.score}`,
                        currentReputation: reputation.score
                    };
                }
                // Check reputation-based limits
                const maxAllowed = this.reputationManager.getMaxLoanAmount(reputation.score);
                if (amount > maxAllowed) {
                    return {
                        canPerform: false,
                        reason: `Amount exceeds reputation-based limit`,
                        currentReputation: reputation.score,
                        maxAllowed
                    };
                }
                return {
                    canPerform: true,
                    currentReputation: reputation.score,
                    maxAllowed
                };
            }
            catch (error) {
                return {
                    canPerform: false,
                    reason: `Check failed: ${error.message}`
                };
            }
        });
    }
    // ==========================================
    // DIRECT ACCESS TO MANAGERS
    // ==========================================
    /**
     * Access to Agent Manager for advanced operations
     */
    get agents() {
        return this.agentManager;
    }
    /**
     * Access to Reputation Manager for advanced operations
     */
    get reputation() {
        return this.reputationManager;
    }
    /**
     * Access to Stellar client for low-level operations
     */
    get client() {
        return this.stellar;
    }
    // ==========================================
    // UTILITY METHODS
    // ==========================================
    /**
     * Get all contract addresses
     */
    getContractAddresses() {
        return Object.assign({}, this.stellar.contracts);
    }
    /**
     * Get network information
     */
    getNetworkInfo() {
        return {
            rpcUrl: this.stellar.rpc.serverURL.toString(),
            networkPassphrase: this.stellar.networkPassphrase,
            contracts: this.stellar.contracts
        };
    }
    /**
     * Validate agent address format
     */
    isValidAgentAddress(address) {
        return typeof address === 'string' &&
            address.startsWith('G') &&
            address.length === 56;
    }
    /**
     * Validate contract address format
     */
    isValidContractAddress(address) {
        return typeof address === 'string' &&
            address.startsWith('C') &&
            address.length === 56;
    }
    /**
     * Format address for display (first 4 + last 4 characters)
     */
    formatAddress(address) {
        if (!address || address.length < 8)
            return address;
        return `${address.slice(0, 4)}...${address.slice(-4)}`;
    }
    /**
     * Convert stroops to XLM
     */
    stroopsToXLM(stroops) {
        return stroops / 10000000;
    }
    /**
     * Convert XLM to stroops
     */
    xlmToStroops(xlm) {
        return Math.floor(xlm * 10000000);
    }
}
exports.DACTP = DACTP;
//# sourceMappingURL=DACTP.js.map