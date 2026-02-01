"use strict";
/**
 * Agent Manager - Handles agent registration, authorization, and management
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
exports.AgentManager = void 0;
const Common_1 = require("../types/Common");
class AgentManager {
    constructor(stellar) {
        this.stellar = stellar;
    }
    /**
     * Register a new agent with specific permissions and limits
     */
    register(params_1) {
        return __awaiter(this, arguments, void 0, function* (params, options = {}) {
            try {
                const args = [
                    params.owner,
                    params.agent,
                    params.scopes,
                    params.maxAmount
                ];
                if (options.signAndSend === false) {
                    // Return unsigned transaction XDR
                    const tx = yield this.stellar.buildContractTx(params.owner, this.stellar.contracts.agentManager, 'register_agent', args);
                    return {
                        hash: tx.toXDR(),
                        success: true
                    };
                }
                // For now, throw error for actual signing since we need wallet integration
                throw new Common_1.DACTPError('Wallet signing not implemented yet. Use signAndSend: false to get unsigned XDR.', Common_1.ErrorCodes.WALLET_ERROR);
            }
            catch (error) {
                throw new Common_1.DACTPError(`Agent registration failed: ${error.message}`, Common_1.ErrorCodes.CONTRACT_ERROR, error);
            }
        });
    }
    /**
     * Revoke an agent permanently
     */
    revoke(params_1) {
        return __awaiter(this, arguments, void 0, function* (params, options = {}) {
            try {
                const args = [params.owner, params.agent];
                if (options.signAndSend === false) {
                    const tx = yield this.stellar.buildContractTx(params.owner, this.stellar.contracts.agentManager, 'revoke_agent', args);
                    return {
                        hash: tx.toXDR(),
                        success: true
                    };
                }
                throw new Common_1.DACTPError('Wallet signing not implemented yet. Use signAndSend: false to get unsigned XDR.', Common_1.ErrorCodes.WALLET_ERROR);
            }
            catch (error) {
                throw new Common_1.DACTPError(`Agent revocation failed: ${error.message}`, Common_1.ErrorCodes.CONTRACT_ERROR, error);
            }
        });
    }
    /**
     * Check if an agent is authorized to perform an action with a specific amount
     */
    isAuthorized(check) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.stellar.simulateCall(this.stellar.contracts.agentManager, 'is_authorized', [check.agent, check.action, check.amount]);
                return {
                    authorized: Boolean(result),
                    reason: result ? undefined : 'Agent not authorized or amount exceeds limit'
                };
            }
            catch (error) {
                return {
                    authorized: false,
                    reason: `Authorization check failed: ${error.message}`
                };
            }
        });
    }
    /**
     * Get agent information
     */
    getInfo(agentAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.stellar.simulateCall(this.stellar.contracts.agentManager, 'get_agent_info', [agentAddress]);
                return result;
            }
            catch (error) {
                console.warn(`Failed to get agent info for ${agentAddress}:`, error.message);
                return null;
            }
        });
    }
    /**
     * Check if an agent exists
     */
    exists(agentAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            const info = yield this.getInfo(agentAddress);
            return info !== null;
        });
    }
}
exports.AgentManager = AgentManager;
//# sourceMappingURL=AgentManager.js.map