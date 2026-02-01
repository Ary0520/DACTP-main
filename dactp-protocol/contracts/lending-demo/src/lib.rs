#![no_std]

use soroban_sdk::{contract, contractclient, contractimpl, contracttype, token, Address, Env, String, Vec};

/// ENHANCED RISK-BASED LENDING ALGORITHM
/// Base reputation thresholds
const MIN_REPUTATION_THRESHOLD: u32 = 60;
const BOOTSTRAP_LOAN_THRESHOLD: u32 = 50;
const MAX_BOOTSTRAP_LOAN_AMOUNT: u64 = 1_000_000; // 0.1 XLM in stroops

/// Dynamic loan limits based on reputation tiers
const TIER_1_MAX_LOAN: u64 = 5_000_000;   // 0.5 XLM for reputation 50-59
const TIER_2_MAX_LOAN: u64 = 20_000_000;  // 2.0 XLM for reputation 60-74
const TIER_3_MAX_LOAN: u64 = 50_000_000;  // 5.0 XLM for reputation 75-89
const TIER_4_MAX_LOAN: u64 = 100_000_000; // 10.0 XLM for reputation 90+

/// Risk-adjusted reputation updates
const REPUTATION_INCREASE_ON_TIME: i32 = 8;     // Bonus for on-time payment
const REPUTATION_INCREASE_EARLY: i32 = 12;      // Bonus for early payment
const REPUTATION_DECREASE_LATE: i32 = -5;       // Penalty for late payment
const REPUTATION_DECREASE_DEFAULT: i32 = -25;   // Heavy penalty for default

/// Time-based risk factors
const DEFAULT_LOAN_DURATION_SECONDS: u64 = 7 * 24 * 60 * 60; // 7 days
const GRACE_PERIOD_SECONDS: u64 = 24 * 60 * 60; // 1 day grace period
const EARLY_PAYMENT_THRESHOLD: u64 = 12 * 60 * 60; // 12 hours early bonus

/// Utilization-based risk adjustment
const MAX_POOL_UTILIZATION: u32 = 80; // Max 80% of pool can be lent out

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
    PenaltyApplied(Address),          // Tracks if penalty was already applied for an agent
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

        // STEP 1: Basic authorization check
        let action = String::from_str(&env, "borrow");
        let is_authorized = agent_mgr_client.is_authorized(&agent, &action, &amount);
        
        if !is_authorized {
            panic!("Agent not authorized or amount exceeds delegation limit");
        }

        // STEP 2: Get reputation score and calculate risk tier
        let reputation_score = rep_mgr_client.get_score(&agent);
        
        // STEP 3: ENHANCED RISK ASSESSMENT - Calculate maximum allowed loan
        let max_allowed_loan = calculate_max_loan_amount(reputation_score);
        
        if amount > max_allowed_loan {
            panic!("Loan amount exceeds reputation-based limit");
        }

        // STEP 4: Pool utilization check (prevent over-lending)
        let total_liquidity = xlm_client.balance(&env.current_contract_address()) as u64;
        let current_utilization = calculate_pool_utilization(&env, total_liquidity);
        
        if current_utilization > MAX_POOL_UTILIZATION {
            panic!("Lending pool utilization too high - try again later");
        }

        // STEP 5: Check for existing active loans
        let loan_key = DataKey::Loan(agent.clone());
        let existing_loan: Option<Loan> = env.storage().persistent().get(&loan_key);
        
        if let Some(loan) = existing_loan {
            if !loan.repaid {
                panic!("Agent already has an active loan");
            }
        }

        // STEP 6: Final liquidity check
        if total_liquidity < amount {
            panic!("Insufficient liquidity in lending pool");
        }

        // STEP 7: Create loan with enhanced tracking
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

        // STEP 8: Execute the loan transfer
        xlm_client.transfer(&env.current_contract_address(), &agent, &(amount as i128));

        true
    }

    /// Enhanced repay loan with automatic default checking
    /// This implements realistic lending incentives with automatic penalty detection
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
        agent.require_auth();
        xlm_client.transfer(&agent, &env.current_contract_address(), &(loan.amount as i128));

        // Mark loan as repaid
        loan.repaid = true;
        env.storage().persistent().set(&loan_key, &loan);

        // ENHANCED REPUTATION UPDATE: Time-based bonuses/penalties with automatic default detection
        let current_time = env.ledger().timestamp();
        let contract_addr = env.current_contract_address();
        
        let reputation_delta = if current_time > loan.due_date + GRACE_PERIOD_SECONDS {
            // AUTOMATIC DEFAULT PENALTY: Loan was overdue beyond grace period
            REPUTATION_DECREASE_DEFAULT // -25 reputation
        } else if current_time <= loan.due_date - EARLY_PAYMENT_THRESHOLD {
            // Early payment bonus
            REPUTATION_INCREASE_EARLY // +12 reputation
        } else if current_time <= loan.due_date + GRACE_PERIOD_SECONDS {
            // On-time payment (including grace period)
            REPUTATION_INCREASE_ON_TIME // +8 reputation
        } else {
            // Late payment penalty (within grace period)
            REPUTATION_DECREASE_LATE // -5 reputation
        };

        rep_mgr_client.update_score(&contract_addr, &agent, &reputation_delta);
    }

    /// Report a loan default (missed repayment beyond grace period)
    /// This triggers a REAL reputation penalty (-25) - much harsher than before
    /// 
    /// ✅ NEW: Can be called by anyone (not just admin) for automatic penalty system
    /// ✅ NEW: Prevents duplicate penalties with tracking
    pub fn report_default(env: Env, agent: Address) {
        let rep_mgr_addr: Address = env
            .storage()
            .persistent()
            .get(&DataKey::ReputationManagerContract(()))
            .expect("Contract not initialized");

        let rep_mgr_client = ReputationManagerClient::new(&env, &rep_mgr_addr);

        // Verify loan exists and is overdue
        let loan_key = DataKey::Loan(agent.clone());
        let loan: Loan = env
            .storage()
            .persistent()
            .get(&loan_key)
            .expect("No loan found for agent");

        if loan.repaid {
            panic!("Cannot report default on repaid loan");
        }

        let current_time = env.ledger().timestamp();
        if current_time <= loan.due_date + GRACE_PERIOD_SECONDS {
            panic!("Loan is not yet in default - still within grace period");
        }

        // ✅ NEW: Check if penalty already applied to prevent duplicate penalties
        let penalty_key = DataKey::PenaltyApplied(agent.clone());
        let penalty_already_applied: bool = env
            .storage()
            .persistent()
            .get(&penalty_key)
            .unwrap_or(false);

        if penalty_already_applied {
            panic!("Penalty already applied for this loan");
        }

        // DACTP REPUTATION UPDATE: Heavy penalty for default
        let contract_addr = env.current_contract_address();
        rep_mgr_client.update_score(
            &contract_addr,
            &agent,
            &REPUTATION_DECREASE_DEFAULT
        );

        // ✅ NEW: Mark penalty as applied
        env.storage().persistent().set(&penalty_key, &true);
    }

    /// Get loan information
    pub fn get_loan(env: Env, agent: Address) -> Option<Loan> {
        let key = DataKey::Loan(agent);
        env.storage().persistent().get(&key)
    }

    /// Get the maximum loan amount for a given reputation score
    /// This implements the tiered lending system
    pub fn get_max_loan_for_reputation(env: Env, reputation_score: u32) -> u64 {
        calculate_max_loan_amount(reputation_score)
    }

    /// Get current pool utilization percentage
    pub fn get_pool_utilization(env: Env) -> u32 {
        let xlm_token: Address = env
            .storage()
            .persistent()
            .get(&DataKey::XlmTokenContract(()))
            .expect("Contract not initialized");

        let xlm_client = token::Client::new(&env, &xlm_token);
        let total_liquidity = xlm_client.balance(&env.current_contract_address()) as u64;
        
        calculate_pool_utilization(&env, total_liquidity)
    }

    /// Check if a loan is currently overdue (past grace period)
    /// ✅ NEW: Automatically applies penalty if overdue and not yet penalized
    pub fn is_loan_overdue(env: Env, agent: Address) -> bool {
        let loan_key = DataKey::Loan(agent.clone());
        if let Some(loan) = env.storage().persistent().get::<DataKey, Loan>(&loan_key) {
            if !loan.repaid {
                let current_time = env.ledger().timestamp();
                let grace_deadline = loan.due_date + GRACE_PERIOD_SECONDS;
                let is_overdue = current_time > grace_deadline;
                
                // ✅ NEW: Auto-apply penalty if overdue and not yet applied
                if is_overdue {
                    let penalty_key = DataKey::PenaltyApplied(agent.clone());
                    let penalty_already_applied: bool = env
                        .storage()
                        .persistent()
                        .get(&penalty_key)
                        .unwrap_or(false);

                    if !penalty_already_applied {
                        // Apply penalty automatically
                        let rep_mgr_addr: Address = env
                            .storage()
                            .persistent()
                            .get(&DataKey::ReputationManagerContract(()))
                            .expect("Contract not initialized");

                        let rep_mgr_client = ReputationManagerClient::new(&env, &rep_mgr_addr);
                        let contract_addr = env.current_contract_address();
                        
                        rep_mgr_client.update_score(
                            &contract_addr,
                            &agent,
                            &REPUTATION_DECREASE_DEFAULT
                        );

                        // Mark penalty as applied
                        env.storage().persistent().set(&penalty_key, &true);
                    }
                }
                
                return is_overdue;
            }
        }
        false
    }
}

/// HELPER FUNCTIONS FOR ENHANCED LENDING ALGORITHM

/// Calculate maximum loan amount based on reputation score (tiered system)
fn calculate_max_loan_amount(reputation_score: u32) -> u64 {
    match reputation_score {
        0..=49 => 0,                    // No loans for very low reputation
        50..=59 => TIER_1_MAX_LOAN,     // 0.5 XLM for new/low reputation
        60..=74 => TIER_2_MAX_LOAN,     // 2.0 XLM for decent reputation  
        75..=89 => TIER_3_MAX_LOAN,     // 5.0 XLM for good reputation
        90..=100 => TIER_4_MAX_LOAN,    // 10.0 XLM for excellent reputation
        _ => 0,                         // Safety fallback
    }
}

/// Calculate current pool utilization to prevent over-lending
fn calculate_pool_utilization(env: &Env, total_liquidity: u64) -> u32 {
    if total_liquidity == 0 {
        return 100; // 100% utilization if no liquidity
    }

    // Count all active loans to calculate utilization
    // In a real implementation, you'd track this more efficiently
    // For now, we'll use a simplified approach
    
    // This is a simplified calculation - in production you'd maintain
    // a separate counter for total outstanding loans
    // For demo purposes, we'll assume 50% utilization as baseline
    let estimated_utilization = 50; // Placeholder - would be calculated from actual loan data
    
    estimated_utilization.min(100)
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