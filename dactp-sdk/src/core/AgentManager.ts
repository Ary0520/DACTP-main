/**
 * Agent Manager - Handles agent registration, authorization, and management
 */

import { StellarClient } from '../utils/stellar';
import { 
  AgentInfo, 
  RegisterAgentParams, 
  RevokeAgentParams, 
  AuthorizationCheck,
  AuthorizationResult 
} from '../types/Agent';
import { TxResult, TxOptions, DACTPError, ErrorCodes } from '../types/Common';

export class AgentManager {
  constructor(private stellar: StellarClient) {}

  /**
   * Register a new agent with specific permissions and limits
   */
  async register(
    params: RegisterAgentParams,
    options: TxOptions = {}
  ): Promise<TxResult> {
    try {
      const args = [
        params.owner,
        params.agent,
        params.scopes,
        params.maxAmount
      ];

      if (options.signAndSend === false) {
        // Return unsigned transaction XDR
        const tx = await this.stellar.buildContractTx(
          params.owner,
          this.stellar.contracts.agentManager,
          'register_agent',
          args
        );
        return {
          hash: tx.toXDR(),
          success: true
        };
      }

      // For now, throw error for actual signing since we need wallet integration
      throw new DACTPError(
        'Wallet signing not implemented yet. Use signAndSend: false to get unsigned XDR.',
        ErrorCodes.WALLET_ERROR
      );

    } catch (error: any) {
      throw new DACTPError(
        `Agent registration failed: ${error.message}`,
        ErrorCodes.CONTRACT_ERROR,
        error
      );
    }
  }

  /**
   * Revoke an agent permanently
   */
  async revoke(
    params: RevokeAgentParams,
    options: TxOptions = {}
  ): Promise<TxResult> {
    try {
      const args = [params.owner, params.agent];

      if (options.signAndSend === false) {
        const tx = await this.stellar.buildContractTx(
          params.owner,
          this.stellar.contracts.agentManager,
          'revoke_agent',
          args
        );
        return {
          hash: tx.toXDR(),
          success: true
        };
      }

      throw new DACTPError(
        'Wallet signing not implemented yet. Use signAndSend: false to get unsigned XDR.',
        ErrorCodes.WALLET_ERROR
      );

    } catch (error: any) {
      throw new DACTPError(
        `Agent revocation failed: ${error.message}`,
        ErrorCodes.CONTRACT_ERROR,
        error
      );
    }
  }

  /**
   * Check if an agent is authorized to perform an action with a specific amount
   */
  async isAuthorized(check: AuthorizationCheck): Promise<AuthorizationResult> {
    try {
      const result = await this.stellar.simulateCall(
        this.stellar.contracts.agentManager,
        'is_authorized',
        [check.agent, check.action, check.amount]
      );

      return {
        authorized: Boolean(result),
        reason: result ? undefined : 'Agent not authorized or amount exceeds limit'
      };

    } catch (error: any) {
      return {
        authorized: false,
        reason: `Authorization check failed: ${error.message}`
      };
    }
  }

  /**
   * Get agent information
   */
  async getInfo(agentAddress: string): Promise<AgentInfo | null> {
    try {
      const result = await this.stellar.simulateCall(
        this.stellar.contracts.agentManager,
        'get_agent_info',
        [agentAddress]
      );

      return result;
    } catch (error: any) {
      console.warn(`Failed to get agent info for ${agentAddress}:`, error.message);
      return null;
    }
  }

  /**
   * Check if an agent exists
   */
  async exists(agentAddress: string): Promise<boolean> {
    const info = await this.getInfo(agentAddress);
    return info !== null;
  }
}