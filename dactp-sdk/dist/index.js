"use strict";
/**
 * DACTP SDK - Decentralized Agent Credit & Trust Protocol
 *
 * The easiest way to integrate reputation-based authorization into your Stellar DeFi dapp.
 *
 * @example
 * ```typescript
 * import { DACTP } from '@dactp/sdk';
 *
 * const dactp = new DACTP({ network: 'mainnet' });
 *
 * // Register an agent
 * await dactp.registerAgent(owner, agent, ['borrow', 'repay'], 1000);
 *
 * // Check authorization
 * const canBorrow = await dactp.checkAuthorization(agent, 'borrow', 500);
 *
 * // Get reputation score
 * const score = await dactp.getReputationScore(agent);
 * ```
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VERSION = exports.NETWORK_CONFIGS = exports.StellarClient = exports.ReputationManager = exports.AgentManager = exports.DACTP = void 0;
// Main SDK class
var DACTP_1 = require("./core/DACTP");
Object.defineProperty(exports, "DACTP", { enumerable: true, get: function () { return DACTP_1.DACTP; } });
// Core managers for advanced usage
var AgentManager_1 = require("./core/AgentManager");
Object.defineProperty(exports, "AgentManager", { enumerable: true, get: function () { return AgentManager_1.AgentManager; } });
var ReputationManager_1 = require("./core/ReputationManager");
Object.defineProperty(exports, "ReputationManager", { enumerable: true, get: function () { return ReputationManager_1.ReputationManager; } });
// Utility classes
var stellar_1 = require("./utils/stellar");
Object.defineProperty(exports, "StellarClient", { enumerable: true, get: function () { return stellar_1.StellarClient; } });
// Type definitions
__exportStar(require("./types/Common"), exports);
__exportStar(require("./types/Agent"), exports);
__exportStar(require("./types/Reputation"), exports);
// Constants and utilities
var stellar_2 = require("./utils/stellar");
Object.defineProperty(exports, "NETWORK_CONFIGS", { enumerable: true, get: function () { return stellar_2.NETWORK_CONFIGS; } });
// Version
exports.VERSION = '1.0.0';
//# sourceMappingURL=index.js.map