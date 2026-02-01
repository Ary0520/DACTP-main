/**
 * Reputation Manager - Handles reputation scoring, tiers, and updates
 */
import { StellarClient } from '../utils/stellar';
import { ReputationScore, ReputationTier, UpdateScoreParams, REPUTATION_DELTAS } from '../types/Reputation';
import { TxResult, TxOptions } from '../types/Common';
export declare class ReputationManager {
    private stellar;
    constructor(stellar: StellarClient);
    /**
     * Get reputation score for an agent
     */
    getScore(agentAddress: string): Promise<ReputationScore>;
    /**
     * Update an agent's reputation score
     */
    updateScore(params: UpdateScoreParams, options?: TxOptions): Promise<TxResult>;
    /**
     * Get reputation tier for a given score
     */
    getTier(score: number): ReputationTier;
    /**
     * Get maximum loan amount for a reputation score
     */
    getMaxLoanAmount(score: number): number;
    /**
     * Check if score qualifies for a specific tier
     */
    qualifiesForTier(score: number, targetTier: number): boolean;
    /**
     * Get all available reputation tiers
     */
    getAllTiers(): ReputationTier[];
    /**
     * Calculate reputation delta for common actions
     */
    getReputationDelta(action: keyof typeof REPUTATION_DELTAS): number;
    /**
     * Predict new score after applying delta
     */
    predictNewScore(currentScore: number, delta: number): ReputationScore;
    /**
     * Check if an agent has sufficient reputation for an action
     */
    hasMinimumReputation(agentAddress: string, minimumScore: number): Promise<boolean>;
    /**
     * Get reputation level name (for display purposes)
     */
    getReputationLevel(score: number): string;
    /**
     * Get reputation color (for UI purposes)
     */
    getReputationColor(score: number): string;
}
//# sourceMappingURL=ReputationManager.d.ts.map