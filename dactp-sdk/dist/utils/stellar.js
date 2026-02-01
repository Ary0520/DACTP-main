"use strict";
/**
 * Stellar/Soroban utilities for DACTP SDK
 * Based on the working implementation from dactp-frontend
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StellarClient = exports.NETWORK_CONFIGS = void 0;
const stellar_sdk_1 = require("@stellar/stellar-sdk");
const Common_1 = require("../types/Common");
exports.NETWORK_CONFIGS = {
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
class StellarClient {
    constructor(config) {
        const network = config.network || 'futurenet';
        const networkConfig = exports.NETWORK_CONFIGS[network];
        this.rpc = new stellar_sdk_1.rpc.Server(config.rpcUrl || networkConfig.rpcUrl);
        this.networkPassphrase = config.networkPassphrase || networkConfig.networkPassphrase;
        this.contracts = Object.assign(Object.assign({}, networkConfig.contracts), config.contracts);
    }
    /**
     * Convert JavaScript values to Soroban ScVal
     */
    toScVal(value, type) {
        if (value === undefined || value === null) {
            throw new Common_1.DACTPError(`Cannot convert ${value} to ScVal`, Common_1.ErrorCodes.VALIDATION_ERROR);
        }
        // Handle Stellar addresses (G... format)
        if (typeof value === "string" && value.startsWith("G") && value.length === 56) {
            try {
                return stellar_sdk_1.Address.fromString(value).toScVal();
            }
            catch (error) {
                throw new Common_1.DACTPError(`Invalid Stellar address: ${value}`, Common_1.ErrorCodes.VALIDATION_ERROR, error);
            }
        }
        // Handle contract addresses (C... format)
        if (typeof value === "string" && value.startsWith("C") && value.length === 56) {
            try {
                return stellar_sdk_1.Address.fromString(value).toScVal();
            }
            catch (error) {
                throw new Common_1.DACTPError(`Invalid contract address: ${value}`, Common_1.ErrorCodes.VALIDATION_ERROR, error);
            }
        }
        // Handle numbers
        if (typeof value === "number") {
            try {
                return (0, stellar_sdk_1.nativeToScVal)(value, { type: type || "u64" });
            }
            catch (error) {
                throw new Common_1.DACTPError(`Failed to convert number ${value} to ScVal`, Common_1.ErrorCodes.VALIDATION_ERROR, error);
            }
        }
        // Handle strings
        if (typeof value === "string") {
            try {
                return (0, stellar_sdk_1.nativeToScVal)(value, { type: "symbol" });
            }
            catch (error) {
                throw new Common_1.DACTPError(`Failed to convert string ${value} to ScVal`, Common_1.ErrorCodes.VALIDATION_ERROR, error);
            }
        }
        // Handle arrays
        if (Array.isArray(value)) {
            try {
                const convertedArray = value.map(v => this.toScVal(v));
                return (0, stellar_sdk_1.nativeToScVal)(convertedArray, { type: "vec" });
            }
            catch (error) {
                throw new Common_1.DACTPError(`Failed to convert array to ScVal`, Common_1.ErrorCodes.VALIDATION_ERROR, error);
            }
        }
        // Default conversion
        try {
            return (0, stellar_sdk_1.nativeToScVal)(value);
        }
        catch (error) {
            throw new Common_1.DACTPError(`Failed to convert value to ScVal`, Common_1.ErrorCodes.VALIDATION_ERROR, error);
        }
    }
    /**
     * Parse Soroban response values
     */
    parseScVal(scVal) {
        if (!scVal)
            return null;
        try {
            const value = (0, stellar_sdk_1.scValToNative)(scVal);
            // Convert BigInt to number for demo simplicity
            if (typeof value === 'bigint') {
                return Number(value);
            }
            return value;
        }
        catch (error) {
            console.warn("Error parsing ScVal:", error);
            return 0;
        }
    }
    /**
     * Build a read-only contract transaction
     */
    buildReadOnlyTx(contractId_1, method_1) {
        return __awaiter(this, arguments, void 0, function* (contractId, method, args = []) {
            try {
                // Use a dummy account for simulation
                const dummyAccountId = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";
                let sourceAccount;
                try {
                    sourceAccount = yield this.rpc.getAccount(dummyAccountId);
                }
                catch (error) {
                    sourceAccount = new stellar_sdk_1.Account(dummyAccountId, "0");
                }
                const contract = new stellar_sdk_1.Contract(contractId);
                const scValArgs = args.map(arg => this.toScVal(arg));
                const operation = contract.call(method, ...scValArgs);
                const tx = new stellar_sdk_1.TransactionBuilder(sourceAccount, {
                    fee: "100000",
                    networkPassphrase: this.networkPassphrase,
                })
                    .addOperation(operation)
                    .setTimeout(30)
                    .build();
                return tx;
            }
            catch (error) {
                throw new Common_1.DACTPError(`Failed to build read-only transaction`, Common_1.ErrorCodes.CONTRACT_ERROR, error);
            }
        });
    }
    /**
     * Build a contract transaction for signing
     */
    buildContractTx(publicKey_1, contractId_1, method_1) {
        return __awaiter(this, arguments, void 0, function* (publicKey, contractId, method, args = []) {
            var _a;
            try {
                const sourceAccount = yield this.rpc.getAccount(publicKey);
                const contract = new stellar_sdk_1.Contract(contractId);
                const scValArgs = args.map(arg => this.toScVal(arg));
                const operation = contract.call(method, ...scValArgs);
                const rawTx = new stellar_sdk_1.TransactionBuilder(sourceAccount, {
                    fee: "100000",
                    networkPassphrase: this.networkPassphrase,
                })
                    .addOperation(operation)
                    .setTimeout(30)
                    .build();
                // Use RPC server's prepareTransaction method
                const preparedTx = yield this.rpc.prepareTransaction(rawTx);
                return preparedTx;
            }
            catch (error) {
                if ((_a = error.message) === null || _a === void 0 ? void 0 : _a.includes('Account not found')) {
                    throw new Common_1.DACTPError(`Account not found: ${publicKey}. Fund this account first.`, Common_1.ErrorCodes.WALLET_ERROR, error);
                }
                throw new Common_1.DACTPError(`Failed to build contract transaction`, Common_1.ErrorCodes.CONTRACT_ERROR, error);
            }
        });
    }
    /**
     * Submit a signed transaction
     */
    submitTx(signedXdr) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const tx = stellar_sdk_1.TransactionBuilder.fromXDR(signedXdr, this.networkPassphrase);
                const result = yield this.rpc.sendTransaction(tx);
                return result;
            }
            catch (error) {
                throw new Common_1.DACTPError(`Failed to submit transaction`, Common_1.ErrorCodes.NETWORK_ERROR, error);
            }
        });
    }
    /**
     * Simulate a read-only contract call
     */
    simulateCall(contractId_1, method_1) {
        return __awaiter(this, arguments, void 0, function* (contractId, method, args = []) {
            var _a;
            try {
                const tx = yield this.buildReadOnlyTx(contractId, method, args);
                const result = yield this.rpc.simulateTransaction(tx);
                if ('error' in result) {
                    throw new Error(result.error);
                }
                return this.parseScVal((_a = result.result) === null || _a === void 0 ? void 0 : _a.retval);
            }
            catch (error) {
                throw new Common_1.DACTPError(`Contract simulation failed`, Common_1.ErrorCodes.CONTRACT_ERROR, error);
            }
        });
    }
}
exports.StellarClient = StellarClient;
//# sourceMappingURL=stellar.js.map