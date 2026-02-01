/**
 * Main DACTP SDK Class - The primary interface for all DACTP Protocol interactions
 */

import { StellarClient } from '../utils/stellar';
import { AgentManager } from './AgentManager';
import { ReputationManager } from './ReputationManager';
import { 
  DACTPConfig, 
  TxResult, 
  TxOptions,
  DACTPError,
  ErrorCodes 
} from '../types/Common';
import { 
  RegisterAgentParams, 
  AuthorizationCheck,
  AuthorizationResult,
  AgentInfo 
} from '../types/Agent';
import { 
  ReputationScore, 
  UpdateScoreParams,
  ReputationTier 
} from '../types/Reputation';

export class DACTP {
  private stellar: StellarClient;
  private agentManager: AgentManager;
  private reputationManager: ReputationManager;

  constructor(config: DACTPConfig = {}) {
    this.stellar = new StellarClient(config);
    this.agentManager = new AgentManager(this.stellar);
    this.reputationManager = new ReputationManager(this.stellar);
  }

  // ==========================================
  // HIGH-LEVEL CONVENIENCE METHODS
  // ==========================================

  /**
   * One-line agent registration
   */
  async registerAgent(
    owner: string,
    agent: string,
    scopes: string[],
    maxAmount: number,
    options: TxOptions = {}
  ): Promise<TxResult> {
    return this.agentManager.register({
      owner,
      agent,
      scopes,
      maxAmount
    }, options);
  }

  /**
   * One-line authorization check
   */
  async checkAuthorization(
    agent: string,
    action: string,
    amount: number
  ): Promise<boolean> {
    const result = await this.agentManager.isAuthorized({
      agent,
      action,
      amount
    });
    return result.authorized;
  }

  /**
   * One-line reputation score retrieval
   */
  async getReputationScore(agentAddress: string): Promise<number> {
    const reputation = await this.reputationManager.getScore(agentAddress);
    return reputation.score;
  }

  /**
   * One-line reputation update
   */
  async updateReputation(
    caller: string,
    agent: string,
    delta: number,
    options: TxOptions = {}
  ): Promise<TxResult> {
    return this.reputationManager.updateScore({
      caller,
      agent,
      delta
    }, options);
  }

  /**
   * Get maximum loan amount based on reputation
   */
  async getMaxLoanAmount(agentAddress: string): Promise<number> {
    const score = await this.getReputationScore(agentAddress);
    return this.reputationManager.getMaxLoanAmount(score);
  }

  /**
   * Check if agent can perform action with amount (combines auth + reputation)
   */
  async canPerformAction(
    agent: string,
    action: string,
    amount: number,
    minimumReputation: number = 50
  ): Promise<{
    canPerform: boolean;
    reason?: string;
    currentReputation?: number;
    maxAllowed?: number;
  }> {
    try {
      // Check authorization first
      const authResult = await this.agentManager.isAuthorized({
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
      const reputation = await this.reputationManager.getScore(agent);
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

    } catch (error: any) {
      return {
        canPerform: false,
        reason: `Check failed: ${error.message}`
      };
    }
  }

  // ==========================================
  // DIRECT ACCESS TO MANAGERS
  // ==========================================

  /**
   * Access to Agent Manager for advanced operations
   */
  get agents(): AgentManager {
    return this.agentManager;
  }

  /**
   * Access to Reputation Manager for advanced operations
   */
  get reputation(): ReputationManager {
    return this.reputationManager;
  }

  /**
   * Access to Stellar client for low-level operations
   */
  get client(): StellarClient {
    return this.stellar;
  }

  // ==========================================
  // UTILITY METHODS
  // ==========================================

  /**
   * Get all contract addresses
   */
  getContractAddresses() {
    return { ...this.stellar.contracts };
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
  isValidAgentAddress(address: string): boolean {
    return typeof address === 'string' && 
           address.startsWith('G') && 
           address.length === 56;
  }

  /**
   * Validate contract address format
   */
  isValidContractAddress(address: string): boolean {
    return typeof address === 'string' && 
           address.startsWith('C') && 
           address.length === 56;
  }

  /**
   * Format address for display (first 4 + last 4 characters)
   */
  formatAddress(address: string): string {
    if (!address || address.length < 8) return address;
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  }

  /**
   * Convert stroops to XLM
   */
  stroopsToXLM(stroops: number): number {
    return stroops / 10_000_000;
  }

  /**
   * Convert XLM to stroops
   */
  xlmToStroops(xlm: number): number {
    return Math.floor(xlm * 10_000_000);
  }
}