/**
 * Reputation-related types for DACTP Protocol
 */
export interface ReputationScore {
    score: number;
    tier: ReputationTier;
    lastUpdated?: number;
}
export interface ReputationTier {
    tier: number;
    name: string;
    minScore: number;
    maxScore: number;
    maxLoanAmount: number;
    color: string;
    description: string;
}
export interface UpdateScoreParams {
    caller: string;
    agent: string;
    delta: number;
    reason?: string;
}
export interface ReputationHistory {
    timestamp: number;
    delta: number;
    reason: string;
    newScore: number;
}
export declare const REPUTATION_TIERS: ReputationTier[];
export declare const REPUTATION_DELTAS: {
    readonly EARLY_PAYMENT: 12;
    readonly ON_TIME_PAYMENT: 8;
    readonly LATE_PAYMENT: -5;
    readonly DEFAULT: -25;
    readonly SUCCESSFUL_TRADE: 2;
    readonly FAILED_TRADE: -5;
    readonly STAKE_REWARD: 1;
    readonly GOVERNANCE_PARTICIPATION: 3;
};
//# sourceMappingURL=Reputation.d.ts.map