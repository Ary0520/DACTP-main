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
export { DACTP } from './core/DACTP';
export { AgentManager } from './core/AgentManager';
export { ReputationManager } from './core/ReputationManager';
export { StellarClient } from './utils/stellar';
export * from './types/Common';
export * from './types/Agent';
export * from './types/Reputation';
export { NETWORK_CONFIGS } from './utils/stellar';
export declare const VERSION = "1.0.0";
//# sourceMappingURL=index.d.ts.map