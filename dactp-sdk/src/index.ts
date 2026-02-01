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

// Main SDK class
export { DACTP } from './core/DACTP';

// Core managers for advanced usage
export { AgentManager } from './core/AgentManager';
export { ReputationManager } from './core/ReputationManager';

// Utility classes
export { StellarClient } from './utils/stellar';

// Type definitions
export * from './types/Common';
export * from './types/Agent';
export * from './types/Reputation';

// Constants and utilities
export { NETWORK_CONFIGS } from './utils/stellar';

// Version
export const VERSION = '1.0.0';