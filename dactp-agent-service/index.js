#!/usr/bin/env node

/**
 * 🔑 DACTP DELEGATED WALLET SERVICE 🔑
 * 
 * Simple scheduled execution service for delegated wallet transactions
 * This service acts as an UNTRUSTED EXECUTOR - all authority comes from on-chain delegation
 * 
 * Core Principle: SAFE ON-CHAIN DELEGATION
 * - Backend does NOT decide when to repay (no business logic)
 * - Backend only triggers repay_loan transactions on schedule
 * - All authorization enforced by DACTP smart contracts
 * - Pure execution trigger with no intelligence claims
 */

require('dotenv').config();
const cron = require('node-cron');
const StellarSdk = require('@stellar/stellar-sdk');
const axios = require('axios');

// 🚀 CONFIGURATION
const CONFIG = {
  network: process.env.STELLAR_NETWORK || 'futurenet',
  rpcUrl: process.env.RPC_URL || 'https://rpc-futurenet.stellar.org',
  networkPassphrase: process.env.NETWORK_PASSPHRASE || 'Test SDF Future Network ; October 2022',
  agentSecretKey: process.env.AGENT_SECRET_KEY,
  contracts: {
    agentManager: process.env.AGENT_MANAGER_CONTRACT,
    reputationManager: process.env.REPUTATION_MANAGER_CONTRACT,
    lendingDemo: process.env.LENDING_DEMO_CONTRACT,
    xlmToken: process.env.XLM_TOKEN_CONTRACT,
  },
  checkIntervalSeconds: parseInt(process.env.CHECK_INTERVAL_SECONDS) || 10, // Check every 10 seconds for demo!
  logLevel: process.env.LOG_LEVEL || 'info',
};

// 🔧 STELLAR SDK SETUP
let keypair, server;

try {
  if (!CONFIG.agentSecretKey) {
    throw new Error('AGENT_SECRET_KEY environment variable is required');
  }
  
  keypair = StellarSdk.Keypair.fromSecret(CONFIG.agentSecretKey);
  server = new StellarSdk.rpc.Server(CONFIG.rpcUrl);
  
  console.log('🚀 DACTP Agent Service Starting...');
  console.log(`📍 Agent Address: ${keypair.publicKey()}`);
  console.log(`🌐 Network: ${CONFIG.network}`);
  console.log(`⏰ Check Interval: ${CONFIG.checkIntervalMinutes} minutes`);
} catch (error) {
  console.error('❌ Configuration Error:', error.message);
  process.exit(1);
}

// 📊 SERVICE STATE
const serviceState = {
  isRunning: false,
  lastCheck: null,
  totalRepayments: 0,
  startTime: new Date(),
};

// 🛠️ UTILITY FUNCTIONS

function log(level, message, data = null) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  
  if (data) {
    console.log(logMessage, data);
  } else {
    console.log(logMessage);
  }
}

function toScVal(value, type) {
  if (typeof value === 'string' && value.startsWith('G')) {
    // Address
    return StellarSdk.Address.fromString(value).toScVal();
  } else if (typeof value === 'number') {
    return StellarSdk.nativeToScVal(value, { type: type || 'u64' });
  } else {
    return StellarSdk.nativeToScVal(value);
  }
}

function parseScVal(scVal) {
  if (!scVal) return null;
  
  try {
    const value = StellarSdk.scValToNative(scVal);
    // Convert BigInt to number for easier handling
    if (typeof value === 'bigint') {
      return Number(value);
    }
    return value;
  } catch (error) {
    log('warn', 'Error parsing ScVal:', error.message);
    return null;
  }
}

// 🔗 CONTRACT INTERACTION FUNCTIONS

async function buildContractTx(contractId, method, args = []) {
  try {
    const sourceAccount = await server.getAccount(keypair.publicKey());
    const contract = new StellarSdk.Contract(contractId);
    
    const rawTx = new StellarSdk.TransactionBuilder(sourceAccount, {
      fee: "100000",
      networkPassphrase: CONFIG.networkPassphrase,
    })
      .addOperation(contract.call(method, ...args))
      .setTimeout(30)
      .build();

    const preparedTx = await server.prepareTransaction(rawTx);
    return preparedTx;
  } catch (error) {
    log('error', `Error building contract transaction: ${method}`, error.message);
    throw error;
  }
}

async function submitTx(transaction) {
  try {
    transaction.sign(keypair);
    const result = await server.sendTransaction(transaction);
    return result;
  } catch (error) {
    log('error', 'Error submitting transaction:', error.message);
    throw error;
  }
}

// 🎯 CORE AGENT FUNCTIONS

async function repayLoan(agentAddress) {
  try {
    log('info', `🔄 Executing scheduled repayment for agent: ${agentAddress}`);
    
    const args = [toScVal(agentAddress)];
    const tx = await buildContractTx(CONFIG.contracts.lendingDemo, 'repay_loan', args);
    
    const result = await submitTx(tx);
    
    if (result.status === 'SUCCESS') {
      log('info', `✅ Successfully executed repayment for agent: ${agentAddress}`);
      serviceState.totalRepayments++;
      return true;
    } else {
      log('error', `❌ Failed to execute repayment for agent: ${agentAddress}`, result);
      return false;
    }
  } catch (error) {
    log('error', `❌ Error executing repayment for ${agentAddress}:`, error.message);
    return false;
  }
}

// 🔍 SIMPLE EXECUTION FUNCTIONS

async function executeScheduledRepayments() {
  try {
    log('info', '🔄 Checking for loans to repay...');
    serviceState.lastCheck = new Date();
    
    // Get the agent address from our keypair
    const agentAddress = keypair.publicKey();
    
    // Check if this agent has an active loan
    const loanInfo = await getLoanInfo(agentAddress);
    
    if (!loanInfo) {
      log('info', '📝 No active loan found for this agent');
      return;
    }
    
    if (loanInfo.repaid) {
      log('info', '📝 Loan already repaid');
      return;
    }
    
    // Get the due date
    const dueDate = await getLoanDueDate(agentAddress);
    if (!dueDate) {
      log('info', '📝 No due date found for loan');
      return;
    }
    
    const currentTime = Math.floor(Date.now() / 1000);
    const timeUntilDue = dueDate - currentTime;
    
    log('info', `📊 Loan due in ${timeUntilDue} seconds`);
    
    // Repay if due in 5 seconds or less (or already overdue)
    if (timeUntilDue <= 5) {
      log('info', '⚡ Loan is due soon or overdue, executing repayment...');
      const success = await repayLoan(agentAddress);
      
      if (success) {
        log('info', '✅ Loan repaid successfully!');
      } else {
        log('error', '❌ Failed to repay loan');
      }
    } else {
      log('info', `⏰ Loan not due yet, waiting ${timeUntilDue} more seconds`);
    }
    
  } catch (error) {
    log('error', '❌ Error in scheduled execution:', error.message);
  }
}

// Helper function to get loan info
async function getLoanInfo(agentAddress) {
  try {
    const args = [toScVal(agentAddress)];
    const tx = await buildContractTx(CONFIG.contracts.lendingDemo, 'get_loan', args);
    
    const result = await server.simulateTransaction(tx);
    if ('error' in result) {
      return null;
    }
    
    const parsed = parseScVal(result.result?.retval);
    return parsed;
  } catch (error) {
    log('warn', `Error getting loan info: ${error.message}`);
    return null;
  }
}

// Helper function to get loan due date
async function getLoanDueDate(agentAddress) {
  try {
    const args = [toScVal(agentAddress)];
    const tx = await buildContractTx(CONFIG.contracts.lendingDemo, 'get_loan_due_date', args);
    
    const result = await server.simulateTransaction(tx);
    if ('error' in result) {
      return null;
    }
    
    const parsed = parseScVal(result.result?.retval);
    return parsed;
  } catch (error) {
    log('warn', `Error getting loan due date: ${error.message}`);
    return null;
  }
}

// 🎮 SERVICE MANAGEMENT

function getServiceStatus() {
  return {
    ...serviceState,
    agentAddress: keypair.publicKey(),
    uptime: Math.floor((Date.now() - serviceState.startTime.getTime()) / 1000),
    config: {
      network: CONFIG.network,
      checkInterval: `${CONFIG.checkIntervalSeconds} seconds`,
    }
  };
}

// 🚀 SERVICE STARTUP

function startService() {
  log('info', '🚀 Starting DACTP Delegated Wallet Service...');
  
  // Schedule simple execution trigger - every 10 seconds for demo!
  const cronExpression = `*/${CONFIG.checkIntervalSeconds} * * * * *`; // Every N seconds
  
  cron.schedule(cronExpression, () => {
    if (serviceState.isRunning) {
      executeScheduledRepayments();
    }
  });
  
  serviceState.isRunning = true;
  
  log('info', `✅ DACTP Delegated Wallet Service started successfully!`);
  log('info', `📅 Execution schedule: Every ${CONFIG.checkIntervalSeconds} seconds`);
  log('info', `🎯 Ready to execute scheduled repayments!`);
  
  // Initial check
  setTimeout(() => {
    executeScheduledRepayments();
  }, 5000); // Wait 5 seconds for startup
}

function stopService() {
  log('info', '🛑 Stopping DACTP Delegated Wallet Service...');
  serviceState.isRunning = false;
  log('info', '✅ Service stopped');
}

// 🎯 API ENDPOINTS (Simple HTTP server for status)
const http = require('http');

const server_http = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.url === '/status' && req.method === 'GET') {
    res.writeHead(200);
    res.end(JSON.stringify(getServiceStatus(), null, 2));
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

// 🎬 MAIN EXECUTION

if (require.main === module) {
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    log('info', '📡 Received SIGINT, shutting down gracefully...');
    stopService();
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    log('info', '📡 Received SIGTERM, shutting down gracefully...');
    stopService();
    process.exit(0);
  });
  
  // Start the service
  startService();
  
  // Start HTTP server for status API
  const PORT = process.env.PORT || 3001;
  server_http.listen(PORT, () => {
    log('info', `🌐 Status API server running on port ${PORT}`);
    log('info', `📊 Status endpoint: http://localhost:${PORT}/status`);
  });
}

module.exports = {
  startService,
  stopService,
  getServiceStatus,
  executeScheduledRepayments,
};