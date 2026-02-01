/**
 * Reputation Manager - Handles reputation scoring, tiers, and updates
 */

import { StellarClient } from '../utils/stellar';
import { 
  ReputationScore, 
  ReputationTier, 
  UpdateScoreParams,
  REPUTATION_TIERS,
  REPUTATION_DELTAS
} from '../types/Reputation';
import { TxResult, TxOptions, DACTPError, ErrorCodes } from '../types/Common';

export class ReputationManager {
  constructor(private stellar: StellarClient) {}

  /**
   * Get reputation score for an agent
   */
  async getScore(agentAddress: string): Promise<ReputationScore> {
    try {
      const score = await this.stellar.simulateCall(
        this.stellar.contracts.reputationManager,
        'get_score',
        [agentAddress]
      );

      const numericScore = typeof score === 'number' ? score : 50; // Default score
      const tier = this.getTier(numericScore);

      return {
        score: numericScore,
        tier,
        lastUpdated: Date.now()
      };

    } catch (error: any) {
      // Return default score if agent not found
      const tier = this.getTier(50);
      return {
        score: 50,
        tier,
        lastUpdated: Date.now()
      };
    }
  }

  /**
   * Update an agent's reputation score
   */
  async updateScore(
    params: UpdateScoreParams,
    options: TxOptions = {}
  ): Promise<TxResult> {
    try {
      const args = [params.caller, params.agent, params.delta];

      if (options.signAndSend === false) {
        const tx = await this.stellar.buildContractTx(
          params.caller,
          this.stellar.contracts.reputationManager,
          'update_score',
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
        `Reputation update failed: ${error.message}`,
        ErrorCodes.CONTRACT_ERROR,
        error
      );
    }
  }

  /**
   * Get reputation tier for a given score
   */
  getTier(score: number): ReputationTier {
    for (const tier of REPUTATION_TIERS) {
      if (score >= tier.minScore && score <= tier.maxScore) {
        return tier;
      }
    }
    // Fallback to lowest tier
    return REPUTATION_TIERS[0];
  }

  /**
   * Get maximum loan amount for a reputation score
   */
  getMaxLoanAmount(score: number): number {
    const tier = this.getTier(score);
    return tier.maxLoanAmount;
  }

  /**
   * Check if score qualifies for a specific tier
   */
  qualifiesForTier(score: number, targetTier: number): boolean {
    const tier = this.getTier(score);
    return tier.tier >= targetTier;
  }

  /**
   * Get all available reputation tiers
   */
  getAllTiers(): ReputationTier[] {
    return [...REPUTATION_TIERS];
  }

  /**
   * Calculate reputation delta for common actions
   */
  getReputationDelta(action: keyof typeof REPUTATION_DELTAS): number {
    return REPUTATION_DELTAS[action];
  }

  /**
   * Predict new score after applying delta
   */
  predictNewScore(currentScore: number, delta: number): ReputationScore {
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
  async hasMinimumReputation(agentAddress: string, minimumScore: number): Promise<boolean> {
    const reputation = await this.getScore(agentAddress);
    return reputation.score >= minimumScore;
  }

  /**
   * Get reputation level name (for display purposes)
   */
  getReputationLevel(score: number): string {
    const tier = this.getTier(score);
    return tier.name;
  }

  /**
   * Get reputation color (for UI purposes)
   */
  getReputationColor(score: number): string {
    const tier = this.getTier(score);
    return tier.color;
  }
}