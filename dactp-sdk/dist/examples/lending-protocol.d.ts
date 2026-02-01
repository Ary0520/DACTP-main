/**
 * Example: Integrating DACTP into a Lending Protocol
 *
 * This example shows how a lending protocol like StellarLend
 * can integrate DACTP for reputation-based lending limits.
 */
export declare class StellarLendIntegration {
    private dactp;
    constructor(network?: 'mainnet' | 'testnet' | 'futurenet');
    /**
     * Process a loan request with DACTP reputation checks
     */
    processLoanRequest(borrower: string, amount: number, durationDays?: number): Promise<{
        approved: boolean;
        reason?: string;
        maxAllowed?: number;
        interestRate?: number;
    }>;
    /**
     * Handle loan repayment and update reputation
     */
    processLoanRepayment(borrower: string, loanId: string, isEarlyPayment?: boolean, isLatePayment?: boolean): Promise<{
        success: boolean;
        reputationDelta: number;
    }>;
    /**
     * Handle loan default and apply heavy reputation penalty
     */
    processLoanDefault(borrower: string, loanId: string): Promise<void>;
    /**
     * Get borrower's lending profile
     */
    getBorrowerProfile(borrower: string): Promise<{
        reputation: number;
        tier: string;
        maxLoanAmount: number;
        estimatedInterestRate: number;
    }>;
    /**
     * Calculate interest rate based on reputation
     * Higher reputation = lower interest rate
     */
    private calculateInterestRate;
    /**
     * Additional business logic checks
     */
    private performBusinessChecks;
}
export declare function exampleUsage(): Promise<void>;
//# sourceMappingURL=lending-protocol.d.ts.map