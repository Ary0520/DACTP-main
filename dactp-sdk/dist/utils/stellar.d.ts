/**
 * Stellar/Soroban utilities for DACTP SDK
 * Based on the working implementation from dactp-frontend
 */
import { rpc as StellarRpc } from '@stellar/stellar-sdk';
import { Network, DACTPConfig } from '../types/Common';
export interface NetworkConfig {
    rpcUrl: string;
    networkPassphrase: string;
    contracts: {
        agentManager: string;
        reputationManager: string;
        lendingDemo: string;
        xlmToken: string;
    };
}
export declare const NETWORK_CONFIGS: Record<Network, NetworkConfig>;
export declare class StellarClient {
    rpc: StellarRpc.Server;
    networkPassphrase: string;
    contracts: NetworkConfig['contracts'];
    constructor(config: DACTPConfig);
    /**
     * Convert JavaScript values to Soroban ScVal
     */
    toScVal(value: any, type?: string): any;
    /**
     * Parse Soroban response values
     */
    parseScVal(scVal: any): any;
    /**
     * Build a read-only contract transaction
     */
    buildReadOnlyTx(contractId: string, method: string, args?: any[]): Promise<any>;
    /**
     * Build a contract transaction for signing
     */
    buildContractTx(publicKey: string, contractId: string, method: string, args?: any[]): Promise<any>;
    /**
     * Submit a signed transaction
     */
    submitTx(signedXdr: string): Promise<any>;
    /**
     * Simulate a read-only contract call
     */
    simulateCall(contractId: string, method: string, args?: any[]): Promise<any>;
}
//# sourceMappingURL=stellar.d.ts.map