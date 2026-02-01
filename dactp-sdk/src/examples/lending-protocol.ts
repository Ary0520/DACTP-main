/**
 * Example: Integrating DACTP into a Lending Protocol
 * 
 * This example shows how a lending protocol like StellarLend
 * can integrate DACTP for reputation-based lending limits.
 */

import { DACTP } from '../core/DACTP';

export class StellarLendIntegration {
  private dactp: DACTP;

  constructor(network: 'mainnet' | 'testnet' | 'futurenet' = 'futurenet') {
    this.dactp = new DACTP({ network });
  }

  /**
   * Process a loan request with DACTP reputation checks
   */
  async processLoanRequest(
    borrower: string,
    amount: number,
    durationDays: number = 30
  ): Promise<{
    approved: boolean;
    reason?: string;
    maxAllowed?: number;
    interestRate?: number;
  }> {
    try {
      // Step 1: Check if borrower can perform borrow action
      const canBorrow = await this.dactp.canPerformAction(
        borrower,
        'borrow',
        amount,
        60 // Minimum reputation of 60 required
      );

      if (!canBorrow.canPerform) {
        return {
          approved: false,
          reason: canBorrow.reason,
          maxAllowed: canBorrow.maxAllowed
        };
      }

      // Step 2: Calculate reputation-based interest rate
      const reputation = canBorrow.currentReputation!;
      const interestRate = this.calculateInterestRate(reputation);

      // Step 3: Additional business logic checks
      const businessChecks = await this.performBusinessChecks(borrower, amount);
      if (!businessChecks.passed) {
        return {
          approved: false,
          reason: businessChecks.reason
        };
      }

      return {
        approved: true,
        interestRate,
        maxAllowed: canBorrow.maxAllowed
      };

    } catch (error: any) {
      return {
        approved: false,
        reason: `Loan processing failed: ${error.message}`
      };
    }
  }

  /**
   * Handle loan repayment and update reputation
   */
  async processLoanRepayment(
    borrower: string,
    loanId: string,
    isEarlyPayment: boolean = false,
    isLatePayment: boolean = false
  ): Promise<{ success: boolean; reputationDelta: number }> {
    try {
      // Determine reputation delta based on payment timing
      let reputationDelta = 8; // On-time payment

      if (isEarlyPayment) {
        reputationDelta = 12; // Early payment bonus
      } else if (isLatePayment) {
        reputationDelta = -5; // Late payment penalty
      }

      // Update reputation (in real implementation, you'd sign this transaction)
      await this.dactp.updateReputation(
        'LENDING_PROTOCOL_ADDRESS', // Your protocol's address
        borrower,
        reputationDelta,
        { signAndSend: false } // Get unsigned XDR for now
      );

      return {
        success: true,
        reputationDelta
      };

    } catch (error: any) {
      console.error('Repayment processing failed:', error);
      return {
        success: false,
        reputationDelta: 0
      };
    }
  }

  /**
   * Handle loan default and apply heavy reputation penalty
   */
  async processLoanDefault(borrower: string, loanId: string): Promise<void> {
    try {
      // Apply heavy penalty for default
      await this.dactp.updateReputation(
        'LENDING_PROTOCOL_ADDRESS',
        borrower,
        -25, // Heavy penalty
        { signAndSend: false }
      );

      console.log(`Applied -25 reputation penalty to ${borrower} for loan default`);
    } catch (error: any) {
      console.error('Default processing failed:', error);
    }
  }

  /**
   * Get borrower's lending profile
   */
  async getBorrowerProfile(borrower: string): Promise<{
    reputation: number;
    tier: string;
    maxLoanAmount: number;
    estimatedInterestRate: number;
  }> {
    const reputation = await this.dactp.reputation.getScore(borrower);
    const maxLoanAmount = await this.dactp.getMaxLoanAmount(borrower);
    const estimatedInterestRate = this.calculateInterestRate(reputation.score);

    return {
      reputation: reputation.score,
      tier: reputation.tier.name,
      maxLoanAmount,
      estimatedInterestRate
    };
  }

  /**
   * Calculate interest rate based on reputation
   * Higher reputation = lower interest rate
   */
  private calculateInterestRate(reputation: number): number {
    const baseRate = 0.12; // 12% base rate
    const reputationDiscount = Math.max(0, (reputation - 50) / 100); // Up to 50% discount
    return Math.max(0.05, baseRate * (1 - reputationDiscount)); // Minimum 5% rate
  }

  /**
   * Additional business logic checks
   */
  private async performBusinessChecks(
    borrower: string,
    amount: number
  ): Promise<{ passed: boolean; reason?: string }> {
    // Example business logic
    if (amount > 1000) {
      return {
        passed: false,
        reason: 'Amount exceeds protocol maximum'
      };
    }

    return { passed: true };
  }
}

// Usage example
export async function exampleUsage() {
  const lending = new StellarLendIntegration('futurenet');

  // Check if user can borrow
  const loanRequest = await lending.processLoanRequest(
    'GBJNTJ56V23KNAG4LBPKLQRVC4GSJ75ICBFQYNI4TQBHQNAYZK4SE7ON',
    500 // 50 XLM
  );

  console.log('Loan Request Result:', loanRequest);

  // Get borrower profile
  const profile = await lending.getBorrowerProfile(
    'GBJNTJ56V23KNAG4LBPKLQRVC4GSJ75ICBFQYNI4TQBHQNAYZK4SE7ON'
  );

  console.log('Borrower Profile:', profile);
}