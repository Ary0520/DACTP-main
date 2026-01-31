#![no_std]

use soroban_sdk::{contract, contractclient, contractimpl, contracttype, token, Address, Env, String, Vec};

/// Minimum reputation score required to borrow (reputation-gated lending)
const MIN_REPUTATION_THRESHOLD: u32 = 60;
/// Special threshold for small "bootstrap" loans to help new agents build reputation
const BOOTSTRAP_LOAN_THRESHOLD: u32 = 50;
const MAX_BOOTSTRAP_LOAN_AMOUNT: u64 = 1_000_000; // 0.1 XLM in stroops

/// Reputation updates based on financial outcomes
const REPUTATION_INCREASE_ON_REPAYMENT: i32 = 5;
const REPUTATION_DECREASE_ON_DEFAULT: i32 = -15;

/// Loan duration and penalty settings
const DEFAULT_LOAN_DURATION_SECONDS: u64 = 7 * 24 * 60 * 60; // 7 days
const GRACE_PERIOD_SECONDS: u64 = 24 * 60 * 60; // 1 day grace period
const LATE_PAYMENT_PENALTY: i32 = -10; // Reputation penalty for late payment

/// Loan represents an active loan with due date tracking
#[contracttype]
#[derive(Clone)]
pub struct Loan {
    pub agent: Address,      // The agent that took the loan
    pub amount: u64,         // Loan amount in XLM (stroops)
    pub repaid: bool,        // Whether the loan has been repaid
    pub due_date: u64,       // Unix timestamp when loan is due
    pub created_at: u64,     // Unix timestamp when loan was created
}

/// Storage keys
#[contracttype]
pub enum DataKey {
    Loan(Address),                    // Maps agent address -> Loan
    AgentManagerContract(()),         // Address of AgentManager contract
    ReputationManagerContract(()),    // Address of ReputationManager contract
    XlmTokenContract(()),             // Address of XLM token contract
    Admin(()),                        // Admin address for liquidity management
}

/// AgentManager contract trait for cross-contract calls
#[contractclient(name = "AgentManagerClient")]
pub trait AgentManagerInterface {
    fn is_authorized(env: Env, agent: Address, action: String, amount: u64) -> bool;
}

/// ReputationManager contract trait for cross-contract calls
#[contractclient(name = "ReputationManagerClient")]
pub trait ReputationManagerInterface {
    fn get_score(env: Env, agent: Address) -> u32;
    fn update_score(env: Env, caller: Address, agent: Address, delta: i32);
}

#[contract]
pub struct LendingDemoContract;

#[contractimpl]
impl LendingDemoContract {
    /// Initialize the lending demo with references to DACTP protocol contracts
    pub fn initialize(
        env: Env,
        admin: Address,
        agent_manager_contract: Address,
        reputation_manager_contract: Address,
        xlm_token_contract: Address,
    ) {
        admin.require_auth();

        env.storage()
            .persistent()
            .set(&DataKey::AgentManagerContract(()), &agent_manager_contract);
        
        env.storage()
            .persistent()
            .set(&DataKey::ReputationManagerContract(()), &reputation_manager_contract);
            
        env.storage()
            .persistent()
            .set(&DataKey::XlmTokenContract(()), &xlm_token_contract);
            
        env.storage()
            .persistent()
            .set(&DataKey::Admin(()), &admin);
    }

    /// Get the current XLM liquidity in the contract
    /// This is simply the contract's XLM token balance
    /// Note: To fund this contract, simply send XLM to the contract address
    pub fn get_liquidity(env: Env) -> i128 {
        let xlm_token: Address = env
            .storage()
            .persistent()
            .get(&DataKey::XlmTokenContract(()))
            .expect("Contract not initialized");

        let xlm_client = token::Client::new(&env, &xlm_token);
        xlm_client.balance(&env.current_contract_address())
    }

    /// Request a loan as an agent with custom duration
    /// This demonstrates REAL reputation-gated lending with ACTUAL XLM TRANSFERS
    /// 
    /// Requirements:
    /// 1. Agent must be authorized via AgentManager
    /// 2. Agent must have reputation >= 60 via ReputationManager
    /// 3. Amount must be within agent's limits
    /// 4. Contract must have sufficient XLM liquidity
    pub fn request_loan(
        env: Env,
        agent: Address,
        amount: u64,
        duration_seconds: u64, // Custom loan duration in seconds
    ) -> bool {
        // Get DACTP contract addresses
        let agent_mgr_addr: Address = env
            .storage()
            .persistent()
            .get(&DataKey::AgentManagerContract(()))
            .expect("Contract not initialized");

        let rep_mgr_addr: Address = env
            .storage()
            .persistent()
            .get(&DataKey::ReputationManagerContract(()))
            .expect("Contract not initialized");

        let xlm_token: Address = env
            .storage()
            .persistent()
            .get(&DataKey::XlmTokenContract(()))
            .expect("Contract not initialized");

        // Create clients for cross-contract calls
        let agent_mgr_client = AgentManagerClient::new(&env, &agent_mgr_addr);
        let rep_mgr_client = ReputationManagerClient::new(&env, &rep_mgr_addr);
        let xlm_client = token::Client::new(&env, &xlm_token);

        // DACTP CHECK 1: Verify agent is authorized for "borrow" action
        let action = String::from_str(&env, "borrow");
        let is_authorized = agent_mgr_client.is_authorized(&agent, &action, &amount);
        
        if !is_authorized {
            panic!("Agent not authorized or amount exceeds limit");
        }

        // DACTP CHECK 2: Verify reputation meets threshold
        let reputation_score = rep_mgr_client.get_score(&agent);
        
        // Allow bootstrap loans for new agents (score 50) up to 0.1 XLM
        let min_threshold = if amount <= MAX_BOOTSTRAP_LOAN_AMOUNT {
            BOOTSTRAP_LOAN_THRESHOLD
        } else {
            MIN_REPUTATION_THRESHOLD
        };
        
        if reputation_score < min_threshold {
            panic!("Insufficient reputation score");
        }

        // Check if agent already has an active loan
        let loan_key = DataKey::Loan(agent.clone());
        let existing_loan: Option<Loan> = env.storage().persistent().get(&loan_key);
        
        if let Some(loan) = existing_loan {
            if !loan.repaid {
                panic!("Agent already has an active loan");
            }
        }

        // LIQUIDITY CHECK: Ensure contract has enough XLM
        let contract_balance = xlm_client.balance(&env.current_contract_address());
        if contract_balance < (amount as i128) {
            panic!("Insufficient liquidity in lending pool");
        }

        // Create and store the loan with custom due date
        let current_time = env.ledger().timestamp();
        let due_date = current_time + duration_seconds;
        
        let loan = Loan {
            agent: agent.clone(),
            amount,
            repaid: false,
            due_date,
            created_at: current_time,
        };

        env.storage().persistent().set(&loan_key, &loan);

        // ACTUAL XLM TRANSFER: Send XLM from contract to agent
        xlm_client.transfer(&env.current_contract_address(), &agent, &(amount as i128));

        true
    }

    /// Repay a loan
    /// This triggers a REAL reputation update (+5) on the ReputationManager
    /// AND receives actual XLM repayment
    pub fn repay_loan(env: Env, agent: Address) {
        // Get DACTP contract addresses
        let agent_mgr_addr: Address = env
            .storage()
            .persistent()
            .get(&DataKey::AgentManagerContract(()))
            .expect("Contract not initialized");

        let rep_mgr_addr: Address = env
            .storage()
            .persistent()
            .get(&DataKey::ReputationManagerContract(()))
            .expect("Contract not initialized");

        let xlm_token: Address = env
            .storage()
            .persistent()
            .get(&DataKey::XlmTokenContract(()))
            .expect("Contract not initialized");

        // Create clients for cross-contract calls
        let agent_mgr_client = AgentManagerClient::new(&env, &agent_mgr_addr);
        let rep_mgr_client = ReputationManagerClient::new(&env, &rep_mgr_addr);
        let xlm_client = token::Client::new(&env, &xlm_token);

        // Get loan information
        let loan_key = DataKey::Loan(agent.clone());
        let mut loan: Loan = env
            .storage()
            .persistent()
            .get(&loan_key)
            .expect("No active loan found");

        if loan.repaid {
            panic!("Loan already repaid");
        }

        // DACTP CHECK: Verify agent is authorized for "repay_loan" action
        let action = String::from_str(&env, "repay_loan");
        let is_authorized = agent_mgr_client.is_authorized(&agent, &action, &loan.amount);
        
        if !is_authorized {
            panic!("Agent not authorized to repay");
        }

        // ACTUAL XLM TRANSFER: Receive XLM repayment from agent to contract
        // Agent must authorize this transfer
        agent.require_auth();
        xlm_client.transfer(&agent, &env.current_contract_address(), &(loan.amount as i128));

        // Mark loan as repaid
        loan.repaid = true;
        env.storage().persistent().set(&loan_key, &loan);

        // DACTP REPUTATION UPDATE: Real on-chain reputation increase
        // This is NOT a simulation - it updates the actual reputation score
        let contract_addr = env.current_contract_address();
        rep_mgr_client.update_score(
            &contract_addr,
            &agent,
            &REPUTATION_INCREASE_ON_REPAYMENT
        );
    }

    /// Report a loan default (missed repayment)
    /// This triggers a REAL reputation penalty (-15)
    pub fn report_default(env: Env, admin: Address, agent: Address) {
        admin.require_auth();

        let rep_mgr_addr: Address = env
            .storage()
            .persistent()
            .get(&DataKey::ReputationManagerContract(()))
            .expect("Contract not initialized");

        let rep_mgr_client = ReputationManagerClient::new(&env, &rep_mgr_addr);

        // DACTP REPUTATION UPDATE: Real penalty for default
        let contract_addr = env.current_contract_address();
        rep_mgr_client.update_score(
            &contract_addr,
            &agent,
            &REPUTATION_DECREASE_ON_DEFAULT
        );
    }

    /// Get loan information
    pub fn get_loan(env: Env, agent: Address) -> Option<Loan> {
        let key = DataKey::Loan(agent);
        env.storage().persistent().get(&key)
    }

    /// Check if a loan is overdue (past due date + grace period)
    pub fn is_loan_overdue(env: Env, agent: Address) -> bool {
        let loan_key = DataKey::Loan(agent);
        if let Some(loan) = env.storage().persistent().get::<DataKey, Loan>(&loan_key) {
            if !loan.repaid {
                let current_time = env.ledger().timestamp();
                let grace_deadline = loan.due_date + GRACE_PERIOD_SECONDS;
                return current_time > grace_deadline;
            }
        }
        false
    }

    /// Get all active loans (for backend monitoring)
    /// Returns a vector of (agent_address, loan) pairs
    pub fn get_all_active_loans(env: Env) -> Vec<(Address, Loan)> {
        // Note: In a production system, you'd want to maintain an index of active loans
        // For this demo, we'll return an empty vector and rely on external monitoring
        // The backend service will track loans it needs to monitor
        Vec::new(&env)
    }

    /// Apply late payment penalty to an agent's reputation
    /// Can only be called by authorized callers (like the backend agent service)
    pub fn apply_late_penalty(env: Env, caller: Address, agent: Address) {
        caller.require_auth();

        // Get DACTP contract addresses
        let rep_mgr_addr: Address = env
            .storage()
            .persistent()
            .get(&DataKey::ReputationManagerContract(()))
            .expect("Contract not initialized");

        let rep_mgr_client = ReputationManagerClient::new(&env, &rep_mgr_addr);

        // Apply late payment penalty
        rep_mgr_client.update_score(&caller, &agent, &LATE_PAYMENT_PENALTY);
    }

    /// Get loan due date for monitoring
    pub fn get_loan_due_date(env: Env, agent: Address) -> Option<u64> {
        let loan_key = DataKey::Loan(agent);
        if let Some(loan) = env.storage().persistent().get::<DataKey, Loan>(&loan_key) {
            if !loan.repaid {
                return Some(loan.due_date);
            }
        }
        None
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::Env;
    use soroban_sdk::testutils::Address as _;

    #[test]
    fn test_contract_initialization() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(LendingDemoContract, ());
        let client = LendingDemoContractClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let agent_manager_addr = Address::generate(&env);
        let reputation_manager_addr = Address::generate(&env);
        let xlm_token_addr = Address::generate(&env);

        // Test initialization
        client.initialize(&admin, &agent_manager_addr, &reputation_manager_addr, &xlm_token_addr);

        // Verify addresses are stored (we can't directly check storage in tests,
        // but if initialization didn't panic, it worked)
    }

    #[test]
    fn test_loan_storage() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(LendingDemoContract, ());
        let client = LendingDemoContractClient::new(&env, &contract_id);

        let agent = Address::generate(&env);

        // Initially no loan should exist
        let loan = client.get_loan(&agent);
        assert!(loan.is_none());

        // Note: We can't test request_loan without the other contracts deployed
        // This demonstrates the contract structure is correct
    }
}
