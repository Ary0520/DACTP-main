/**
 * Example: Integrating DACTP into a DEX Protocol
 * 
 * This example shows how a DEX like StellarDEX can use DACTP
 * for reputation-based trading limits and margin trading.
 */

import { DACTP } from '../core/DACTP';

export class StellarDEXIntegration {
  private dactp: DACTP;

  constructor(network: 'mainnet' | 'testnet' | 'futurenet' = 'futurenet') {
    this.dactp = new DACTP({ network });
  }

  /**
   * Check if trader can execute a trade with given amount
   */
  async canExecuteTrade(
    trader: string,
    tradeAmount: number,
    tradeType: 'spot' | 'margin' = 'spot'
  ): Promise<{
    canTrade: boolean;
    maxAllowed?: number;
    reason?: string;
    leverageAllowed?: number;
  }> {
    try {
      const reputation = await this.dactp.reputation.getScore(trader);
      const tier = reputation.tier;

      // Different limits for different trade types
      let maxTradeAmount: number;
      let leverageAllowed = 1; // No leverage by default

      if (tradeType === 'spot') {
        // Spot trading limits based on reputation tier
        maxTradeAmount = this.getSpotTradingLimit(tier.tier);
      } else {
        // Margin trading requires higher reputation
        if (reputation.score < 70) {
          return {
            canTrade: false,
            reason: 'Margin trading requires reputation score of 70+',
            maxAllowed: 0
          };
        }
        maxTradeAmount = this.getMarginTradingLimit(tier.tier);
        leverageAllowed = this.getAllowedLeverage(tier.tier);
      }

      if (tradeAmount > maxTradeAmount) {
        return {
          canTrade: false,
          reason: `Trade amount exceeds ${tier.name} tier limit`,
          maxAllowed: maxTradeAmount
        };
      }

      return {
        canTrade: true,
        maxAllowed: maxTradeAmount,
        leverageAllowed
      };

    } catch (error: any) {
      return {
        canTrade: false,
        reason: `Trade check failed: ${error.message}`
      };
    }
  }

  /**
   * Execute trade and update reputation based on outcome
   */
  async executeTrade(
    trader: string,
    tradeAmount: number,
    tradeType: 'spot' | 'margin',
    leverage: number = 1
  ): Promise<{
    success: boolean;
    tradeId?: string;
    reputationDelta?: number;
  }> {
    try {
      // Check if trade is allowed
      const canTrade = await this.canExecuteTrade(trader, tradeAmount, tradeType);
      if (!canTrade.canTrade) {
        return {
          success: false
        };
      }

      // Simulate trade execution
      const tradeResult = await this.simulateTradeExecution(
        trader,
        tradeAmount,
        tradeType,
        leverage
      );

      // Update reputation based on trade outcome
      let reputationDelta = 0;
      if (tradeResult.profitable) {
        reputationDelta = tradeType === 'margin' ? 3 : 2; // Higher reward for margin
      } else {
        reputationDelta = tradeResult.majorLoss ? -10 : -2; // Penalty for losses
      }

      // Apply reputation update (unsigned for now)
      await this.dactp.updateReputation(
        'DEX_PROTOCOL_ADDRESS',
        trader,
        reputationDelta,
        { signAndSend: false }
      );

      return {
        success: true,
        tradeId: tradeResult.tradeId,
        reputationDelta
      };

    } catch (error: any) {
      console.error('Trade execution failed:', error);
      return { success: false };
    }
  }

  /**
   * Get trader's profile with trading limits
   */
  async getTraderProfile(trader: string): Promise<{
    reputation: number;
    tier: string;
    spotTradingLimit: number;
    marginTradingLimit: number;
    maxLeverage: number;
    canMarginTrade: boolean;
  }> {
    const reputation = await this.dactp.reputation.getScore(trader);
    const tier = reputation.tier;

    return {
      reputation: reputation.score,
      tier: tier.name,
      spotTradingLimit: this.getSpotTradingLimit(tier.tier),
      marginTradingLimit: this.getMarginTradingLimit(tier.tier),
      maxLeverage: this.getAllowedLeverage(tier.tier),
      canMarginTrade: reputation.score >= 70
    };
  }

  /**
   * Handle liquidation and apply reputation penalty
   */
  async handleLiquidation(trader: string, liquidationAmount: number): Promise<void> {
    try {
      // Heavy penalty for getting liquidated
      const penalty = liquidationAmount > 1000 ? -15 : -10;
      
      await this.dactp.updateReputation(
        'DEX_PROTOCOL_ADDRESS',
        trader,
        penalty,
        { signAndSend: false }
      );

      console.log(`Applied ${penalty} reputation penalty for liquidation`);
    } catch (error: any) {
      console.error('Liquidation handling failed:', error);
    }
  }

  // Private helper methods

  private getSpotTradingLimit(tier: number): number {
    const limits = [0, 100, 500, 2000, 10000]; // XLM limits per tier
    return limits[tier] || 0;
  }

  private getMarginTradingLimit(tier: number): number {
    const limits = [0, 0, 200, 1000, 5000]; // XLM limits per tier (margin)
    return limits[tier] || 0;
  }

  private getAllowedLeverage(tier: number): number {
    const leverage = [1, 1, 2, 5, 10]; // Max leverage per tier
    return leverage[tier] || 1;
  }

  private async simulateTradeExecution(
    trader: string,
    amount: number,
    type: string,
    leverage: number
  ): Promise<{
    tradeId: string;
    profitable: boolean;
    majorLoss: boolean;
  }> {
    // Simulate trade outcome (in real implementation, this would be actual trading logic)
    const profitable = Math.random() > 0.4; // 60% chance of profit
    const majorLoss = !profitable && Math.random() > 0.8; // 20% chance of major loss

    return {
      tradeId: `trade_${Date.now()}`,
      profitable,
      majorLoss
    };
  }
}

// Usage example
export async function exampleDEXUsage() {
  const dex = new StellarDEXIntegration('futurenet');

  // Check if user can margin trade
  const canTrade = await dex.canExecuteTrade(
    'GBJNTJ56V23KNAG4LBPKLQRVC4GSJ75ICBFQYNI4TQBHQNAYZK4SE7ON',
    1000, // 100 XLM
    'margin'
  );

  console.log('Can Trade:', canTrade);

  // Get trader profile
  const profile = await dex.getTraderProfile(
    'GBJNTJ56V23KNAG4LBPKLQRVC4GSJ75ICBFQYNI4TQBHQNAYZK4SE7ON'
  );

  console.log('Trader Profile:', profile);
}