/**
 * Example: Integrating DACTP into a DEX Protocol
 *
 * This example shows how a DEX like StellarDEX can use DACTP
 * for reputation-based trading limits and margin trading.
 */
export declare class StellarDEXIntegration {
    private dactp;
    constructor(network?: 'mainnet' | 'testnet' | 'futurenet');
    /**
     * Check if trader can execute a trade with given amount
     */
    canExecuteTrade(trader: string, tradeAmount: number, tradeType?: 'spot' | 'margin'): Promise<{
        canTrade: boolean;
        maxAllowed?: number;
        reason?: string;
        leverageAllowed?: number;
    }>;
    /**
     * Execute trade and update reputation based on outcome
     */
    executeTrade(trader: string, tradeAmount: number, tradeType: 'spot' | 'margin', leverage?: number): Promise<{
        success: boolean;
        tradeId?: string;
        reputationDelta?: number;
    }>;
    /**
     * Get trader's profile with trading limits
     */
    getTraderProfile(trader: string): Promise<{
        reputation: number;
        tier: string;
        spotTradingLimit: number;
        marginTradingLimit: number;
        maxLeverage: number;
        canMarginTrade: boolean;
    }>;
    /**
     * Handle liquidation and apply reputation penalty
     */
    handleLiquidation(trader: string, liquidationAmount: number): Promise<void>;
    private getSpotTradingLimit;
    private getMarginTradingLimit;
    private getAllowedLeverage;
    private simulateTradeExecution;
}
export declare function exampleDEXUsage(): Promise<void>;
//# sourceMappingURL=dex-integration.d.ts.map