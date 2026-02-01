/**
 * Main DACTP SDK Class - The primary interface for all DACTP Protocol interactions
 */
import { StellarClient } from '../utils/stellar';
import { AgentManager } from './AgentManager';
import { ReputationManager } from './ReputationManager';
import { DACTPConfig, TxResult, TxOptions } from '../types/Common';
export declare class DACTP {
    private stellar;
    private agentManager;
    private reputationManager;
    constructor(config?: DACTPConfig);
    /**
     * One-line agent registration
     */
    registerAgent(owner: string, agent: string, scopes: string[], maxAmount: number, options?: TxOptions): Promise<TxResult>;
    /**
     * One-line authorization check
     */
    checkAuthorization(agent: string, action: string, amount: number): Promise<boolean>;
    /**
     * One-line reputation score retrieval
     */
    getReputationScore(agentAddress: string): Promise<number>;
    /**
     * One-line reputation update
     */
    updateReputation(caller: string, agent: string, delta: number, options?: TxOptions): Promise<TxResult>;
    /**
     * Get maximum loan amount based on reputation
     */
    getMaxLoanAmount(agentAddress: string): Promise<number>;
    /**
     * Check if agent can perform action with amount (combines auth + reputation)
     */
    canPerformAction(agent: string, action: string, amount: number, minimumReputation?: number): Promise<{
        canPerform: boolean;
        reason?: string;
        currentReputation?: number;
        maxAllowed?: number;
    }>;
    /**
     * Access to Agent Manager for advanced operations
     */
    get agents(): AgentManager;
    /**
     * Access to Reputation Manager for advanced operations
     */
    get reputation(): ReputationManager;
    /**
     * Access to Stellar client for low-level operations
     */
    get client(): StellarClient;
    /**
     * Get all contract addresses
     */
    getContractAddresses(): {
        agentManager: string;
        reputationManager: string;
        lendingDemo: string;
        xlmToken: string;
    };
    /**
     * Get network information
     */
    getNetworkInfo(): {
        rpcUrl: any;
        networkPassphrase: string;
        contracts: {
            agentManager: string;
            reputationManager: string;
            lendingDemo: string;
            xlmToken: string;
        };
    };
    /**
     * Validate agent address format
     */
    isValidAgentAddress(address: string): boolean;
    /**
     * Validate contract address format
     */
    isValidContractAddress(address: string): boolean;
    /**
     * Format address for display (first 4 + last 4 characters)
     */
    formatAddress(address: string): string;
    /**
     * Convert stroops to XLM
     */
    stroopsToXLM(stroops: number): number;
    /**
     * Convert XLM to stroops
     */
    xlmToStroops(xlm: number): number;
}
//# sourceMappingURL=DACTP.d.ts.map