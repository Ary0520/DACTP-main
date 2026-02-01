/**
 * Common types used throughout the DACTP SDK
 */
export type Network = 'mainnet' | 'testnet' | 'futurenet' | 'standalone';
export interface DACTPConfig {
    network?: Network;
    rpcUrl?: string;
    networkPassphrase?: string;
    contracts?: {
        agentManager?: string;
        reputationManager?: string;
        lendingDemo?: string;
        xlmToken?: string;
    };
    wallet?: WalletConfig;
}
export interface WalletConfig {
    type?: 'freighter' | 'albedo' | 'walletconnect' | 'manual';
    autoSign?: boolean;
    secretKey?: string;
}
export interface TxResult {
    hash: string;
    success: boolean;
    events?: ContractEvent[];
    error?: string;
}
export interface ContractEvent {
    type: string;
    data: any;
}
export interface TxOptions {
    signAndSend?: boolean;
    secretKey?: string;
    fee?: number;
}
export declare class DACTPError extends Error {
    code: string;
    details?: any | undefined;
    constructor(message: string, code: string, details?: any | undefined);
}
export declare enum ErrorCodes {
    NETWORK_ERROR = "NETWORK_ERROR",
    CONTRACT_ERROR = "CONTRACT_ERROR",
    VALIDATION_ERROR = "VALIDATION_ERROR",
    WALLET_ERROR = "WALLET_ERROR",
    UNAUTHORIZED = "UNAUTHORIZED",
    INSUFFICIENT_REPUTATION = "INSUFFICIENT_REPUTATION"
}
//# sourceMappingURL=Common.d.ts.map