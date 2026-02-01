"use strict";
/**
 * Reputation-related types for DACTP Protocol
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.REPUTATION_DELTAS = exports.REPUTATION_TIERS = void 0;
exports.REPUTATION_TIERS = [
    {
        tier: 0,
        name: 'No Credit',
        minScore: 0,
        maxScore: 49,
        maxLoanAmount: 0,
        color: '#ef4444',
        description: 'No lending access - build reputation first'
    },
    {
        tier: 1,
        name: 'Basic',
        minScore: 50,
        maxScore: 59,
        maxLoanAmount: 0.5,
        color: '#f97316',
        description: 'Small loans available - prove your reliability'
    },
    {
        tier: 2,
        name: 'Good',
        minScore: 60,
        maxScore: 74,
        maxLoanAmount: 2.0,
        color: '#eab308',
        description: 'Moderate loans available - good track record'
    },
    {
        tier: 3,
        name: 'Excellent',
        minScore: 75,
        maxScore: 89,
        maxLoanAmount: 5.0,
        color: '#84cc16',
        description: 'Large loans available - excellent reputation'
    },
    {
        tier: 4,
        name: 'Elite',
        minScore: 90,
        maxScore: 100,
        maxLoanAmount: 10.0,
        color: '#22c55e',
        description: 'Maximum loans available - elite status'
    }
];
exports.REPUTATION_DELTAS = {
    EARLY_PAYMENT: 12,
    ON_TIME_PAYMENT: 8,
    LATE_PAYMENT: -5,
    DEFAULT: -25,
    SUCCESSFUL_TRADE: 2,
    FAILED_TRADE: -5,
    STAKE_REWARD: 1,
    GOVERNANCE_PARTICIPATION: 3
};
//# sourceMappingURL=Reputation.js.map