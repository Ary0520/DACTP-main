/**
 * Stellar/Soroban utilities for DACTP SDK
 * Based on the working implementation from dactp-frontend
 */

import {
  rpc as StellarRpc,
  TransactionBuilder,
  Contract,
  nativeToScVal,
  scValToNative,
  Address,
  Account,
} from '@stellar/stellar-sdk';
import { Network, DACTPConfig, DACTPError, ErrorCodes } from '../types/Common';

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

export const NETWORK_CONFIGS: Record<Network, NetworkConfig> = {
  mainnet: {
    rpcUrl: 'https://soroban-rpc.mainnet.stellar.org',
    networkPassphrase: 'Public Global Stellar Network ; September 2015',
    contracts: {
      agentManager: '', // To be filled when deployed to mainnet
      reputationManager: '',
      lendingDemo: '',
      xlmToken: 'CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ36ASBEML7VHVHF5RKQWN'
    }
  },
  testnet: {
    rpcUrl: 'https://soroban-rpc.testnet.stellar.org',
    networkPassphrase: 'Test SDF Network ; September 2015',
    contracts: {
      agentManager: '', // To be filled when deployed to testnet
      reputationManager: '',
      lendingDemo: '',
      xlmToken: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQAHHAGCN4YU'
    }
  },
  futurenet: {
    rpcUrl: 'https://rpc-futurenet.stellar.org',
    networkPassphrase: 'Test SDF Future Network ; October 2022',
    contracts: {
      agentManager: 'CD4L232BN5LS537F23LF4GAL53I6GV6JDKYQ73B6HE4YY6S6OZR3MS4R',
      reputationManager: 'CDWF4BNN2GTUHDKRBPSUA7K6NTIS75YYVHBSFFFDGWPWU635GZY6PHEN',
      lendingDemo: 'CD4ZOPXBNM7NV5FVY2L2ZW4TKLDC4B4CKHE3II5VCA743CPKFMH3N4WM',
      xlmToken: 'CB64D3G7SM2RTH6JSGG34DDTFTQ5CFDKVDZJZSODMCX4NJ2HV2KN7OHT'
    }
  },
  standalone: {
    rpcUrl: 'http://localhost:8000/soroban/rpc',
    networkPassphrase: 'Standalone Network ; February 2017',
    contracts: {
      agentManager: '',
      reputationManager: '',
      lendingDemo: '',
      xlmToken: ''
    }
  }
};

export class StellarClient {
  public rpc: StellarRpc.Server;
  public networkPassphrase: string;
  public contracts: NetworkConfig['contracts'];

  constructor(config: DACTPConfig) {
    const network = config.network || 'futurenet';
    const networkConfig = NETWORK_CONFIGS[network];
    
    this.rpc = new StellarRpc.Server(config.rpcUrl || networkConfig.rpcUrl);
    this.networkPassphrase = config.networkPassphrase || networkConfig.networkPassphrase;
    this.contracts = { ...networkConfig.contracts, ...config.contracts };
  }

  /**
   * Convert JavaScript values to Soroban ScVal
   */
  toScVal(value: any, type?: string): any {
    if (value === undefined || value === null) {
      throw new DACTPError(
        `Cannot convert ${value} to ScVal`,
        ErrorCodes.VALIDATION_ERROR
      );
    }

    // Handle Stellar addresses (G... format)
    if (typeof value === "string" && value.startsWith("G") && value.length === 56) {
      try {
        return Address.fromString(value).toScVal();
      } catch (error: any) {
        throw new DACTPError(
          `Invalid Stellar address: ${value}`,
          ErrorCodes.VALIDATION_ERROR,
          error
        );
      }
    }

    // Handle contract addresses (C... format)
    if (typeof value === "string" && value.startsWith("C") && value.length === 56) {
      try {
        return Address.fromString(value).toScVal();
      } catch (error: any) {
        throw new DACTPError(
          `Invalid contract address: ${value}`,
          ErrorCodes.VALIDATION_ERROR,
          error
        );
      }
    }

    // Handle numbers
    if (typeof value === "number") {
      try {
        return nativeToScVal(value, { type: type || "u64" });
      } catch (error: any) {
        throw new DACTPError(
          `Failed to convert number ${value} to ScVal`,
          ErrorCodes.VALIDATION_ERROR,
          error
        );
      }
    }

    // Handle strings
    if (typeof value === "string") {
      try {
        return nativeToScVal(value, { type: "symbol" });
      } catch (error: any) {
        throw new DACTPError(
          `Failed to convert string ${value} to ScVal`,
          ErrorCodes.VALIDATION_ERROR,
          error
        );
      }
    }

    // Handle arrays
    if (Array.isArray(value)) {
      try {
        const convertedArray = value.map(v => this.toScVal(v));
        return nativeToScVal(convertedArray, { type: "vec" });
      } catch (error: any) {
        throw new DACTPError(
          `Failed to convert array to ScVal`,
          ErrorCodes.VALIDATION_ERROR,
          error
        );
      }
    }

    // Default conversion
    try {
      return nativeToScVal(value);
    } catch (error: any) {
      throw new DACTPError(
        `Failed to convert value to ScVal`,
        ErrorCodes.VALIDATION_ERROR,
        error
      );
    }
  }

  /**
   * Parse Soroban response values
   */
  parseScVal(scVal: any): any {
    if (!scVal) return null;

    try {
      const value = scValToNative(scVal);

      // Convert BigInt to number for demo simplicity
      if (typeof value === 'bigint') {
        return Number(value);
      }

      return value;
    } catch (error) {
      console.warn("Error parsing ScVal:", error);
      return 0;
    }
  }

  /**
   * Build a read-only contract transaction
   */
  async buildReadOnlyTx(
    contractId: string,
    method: string,
    args: any[] = []
  ): Promise<any> {
    try {
      // Use a dummy account for simulation
      const dummyAccountId = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";
      let sourceAccount;
      
      try {
        sourceAccount = await this.rpc.getAccount(dummyAccountId);
      } catch (error) {
        sourceAccount = new Account(dummyAccountId, "0");
      }

      const contract = new Contract(contractId);
      const scValArgs = args.map(arg => this.toScVal(arg));
      const operation = contract.call(method, ...scValArgs);

      const tx = new TransactionBuilder(sourceAccount, {
        fee: "100000",
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(operation)
        .setTimeout(30)
        .build();

      return tx;
    } catch (error: any) {
      throw new DACTPError(
        `Failed to build read-only transaction`,
        ErrorCodes.CONTRACT_ERROR,
        error
      );
    }
  }

  /**
   * Build a contract transaction for signing
   */
  async buildContractTx(
    publicKey: string,
    contractId: string,
    method: string,
    args: any[] = []
  ): Promise<any> {
    try {
      const sourceAccount = await this.rpc.getAccount(publicKey);
      const contract = new Contract(contractId);
      const scValArgs = args.map(arg => this.toScVal(arg));
      const operation = contract.call(method, ...scValArgs);

      const rawTx = new TransactionBuilder(sourceAccount, {
        fee: "100000",
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(operation)
        .setTimeout(30)
        .build();

      // Use RPC server's prepareTransaction method
      const preparedTx = await this.rpc.prepareTransaction(rawTx);
      return preparedTx;
    } catch (error: any) {
      if (error.message?.includes('Account not found')) {
        throw new DACTPError(
          `Account not found: ${publicKey}. Fund this account first.`,
          ErrorCodes.WALLET_ERROR,
          error
        );
      }
      throw new DACTPError(
        `Failed to build contract transaction`,
        ErrorCodes.CONTRACT_ERROR,
        error
      );
    }
  }

  /**
   * Submit a signed transaction
   */
  async submitTx(signedXdr: string): Promise<any> {
    try {
      const tx = TransactionBuilder.fromXDR(signedXdr, this.networkPassphrase);
      const result = await this.rpc.sendTransaction(tx);
      return result;
    } catch (error: any) {
      throw new DACTPError(
        `Failed to submit transaction`,
        ErrorCodes.NETWORK_ERROR,
        error
      );
    }
  }

  /**
   * Simulate a read-only contract call
   */
  async simulateCall(
    contractId: string,
    method: string,
    args: any[] = []
  ): Promise<any> {
    try {
      const tx = await this.buildReadOnlyTx(contractId, method, args);
      const result = await this.rpc.simulateTransaction(tx);
      
      if ('error' in result) {
        throw new Error(result.error);
      }
      
      return this.parseScVal(result.result?.retval);
    } catch (error: any) {
      throw new DACTPError(
        `Contract simulation failed`,
        ErrorCodes.CONTRACT_ERROR,
        error
      );
    }
  }
}