#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, Address, Env};

/// Reputation score bounds
const MIN_SCORE: u32 = 0;
const MAX_SCORE: u32 = 100;
const DEFAULT_SCORE: u32 = 50; // Neutral, unproven user

/// Storage keys for reputation data
#[contracttype]
pub enum DataKey {
    Score(Address),            // Maps agent address -> reputation score
    ApprovedCallers(Address),  // Maps contract address -> bool (authorized to update scores)
    Admin(()),                 // The admin who can approve callers
}

#[contract]
pub struct ReputationManagerContract;

#[contractimpl]
impl ReputationManagerContract {
    /// Initialize the contract with an admin address
    /// Admin can approve which contracts can update reputation scores
    pub fn initialize(env: Env, admin: Address) {
        admin.require_auth();
        
        let key = DataKey::Admin(());
        env.storage().persistent().set(&key, &admin);
    }

    /// Approve a contract to update reputation scores
    /// Only admin can call this
    pub fn approve_caller(env: Env, admin: Address, caller: Address) {
        admin.require_auth();
        
        // Verify the caller is the admin
        let stored_admin: Address = env
            .storage()
            .persistent()
            .get(&DataKey::Admin(()))
            .expect("Contract not initialized");
        
        if stored_admin != admin {
            panic!("Unauthorized: only admin can approve callers");
        }

        let key = DataKey::ApprovedCallers(caller);
        env.storage().persistent().set(&key, &true);
    }

    /// Get the reputation score for an agent
    /// Returns DEFAULT_SCORE (50) if no score exists yet
    pub fn get_score(env: Env, agent: Address) -> u32 {
        let key = DataKey::Score(agent);
        env.storage()
            .persistent()
            .get(&key)
            .unwrap_or(DEFAULT_SCORE)
    }

    /// Update an agent's reputation score by a delta (positive or negative)
    /// Can only be called by approved consumer contracts (e.g., lending demo)
    /// This is triggered by real financial outcomes, not simulations
    pub fn update_score(env: Env, caller: Address, agent: Address, delta: i32) {
        // Verify caller is approved
        let approved_key = DataKey::ApprovedCallers(caller.clone());
        let is_approved: bool = env
            .storage()
            .persistent()
            .get(&approved_key)
            .unwrap_or(false);

        if !is_approved {
            panic!("Unauthorized: caller not approved to update scores");
        }

        // Get current score (defaults to 50 for new agents)
        let current_score = Self::get_score(env.clone(), agent.clone());

        // Calculate new score with bounds checking
        let new_score = if delta >= 0 {
            // Positive delta - use saturating add
            let added = current_score.saturating_add(delta as u32);
            if added > MAX_SCORE {
                MAX_SCORE
            } else {
                added
            }
        } else {
            // Negative delta - use saturating sub
            let subtracted = current_score.saturating_sub((-delta) as u32);
            if subtracted < MIN_SCORE {
                MIN_SCORE
            } else {
                subtracted
            }
        };

        // Store the new score
        let score_key = DataKey::Score(agent);
        env.storage().persistent().set(&score_key, &new_score);
    }

    /// Freeze an agent's reputation (sets to 0, representing severe violation)
    /// Only approved callers can freeze
    pub fn freeze_reputation(env: Env, caller: Address, agent: Address) {
        // Verify caller is approved
        let approved_key = DataKey::ApprovedCallers(caller);
        let is_approved: bool = env
            .storage()
            .persistent()
            .get(&approved_key)
            .unwrap_or(false);

        if !is_approved {
            panic!("Unauthorized: caller not approved");
        }

        // Set score to 0 (frozen)
        let score_key = DataKey::Score(agent);
        env.storage().persistent().set(&score_key, &MIN_SCORE);
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::Env;
    use soroban_sdk::testutils::Address as _;

    #[test]
    fn test_default_score() {
        let env = Env::default();
        let contract_id = env.register(ReputationManagerContract, ());
        let client = ReputationManagerContractClient::new(&env, &contract_id);

        let agent = Address::generate(&env);

        // New agent should have default score of 50
        assert_eq!(client.get_score(&agent), 50);
    }

    #[test]
    fn test_update_score() {
        let env = Env::default();
        let contract_id = env.register(ReputationManagerContract, ());
        let client = ReputationManagerContractClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let caller = Address::generate(&env);
        let agent = Address::generate(&env);

        env.mock_all_auths();

        // Initialize and approve caller
        client.initialize(&admin);
        client.approve_caller(&admin, &caller);

        // Initial score should be 50
        assert_eq!(client.get_score(&agent), 50);

        // Update score by +5 (simulating loan repayment)
        client.update_score(&caller, &agent, &5);
        assert_eq!(client.get_score(&agent), 55);

        // Update score by -15 (simulating loan default)
        client.update_score(&caller, &agent, &-15);
        assert_eq!(client.get_score(&agent), 40);
    }

    #[test]
    fn test_score_bounds() {
        let env = Env::default();
        let contract_id = env.register(ReputationManagerContract, ());
        let client = ReputationManagerContractClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let caller = Address::generate(&env);
        let agent = Address::generate(&env);

        env.mock_all_auths();

        client.initialize(&admin);
        client.approve_caller(&admin, &caller);

        // Try to go above MAX_SCORE (100)
        client.update_score(&caller, &agent, &100);
        assert_eq!(client.get_score(&agent), 100); // Should cap at 100

        // Try to go below MIN_SCORE (0)
        client.update_score(&caller, &agent, &-200);
        assert_eq!(client.get_score(&agent), 0); // Should floor at 0
    }

    #[test]
    fn test_freeze_reputation() {
        let env = Env::default();
        let contract_id = env.register(ReputationManagerContract, ());
        let client = ReputationManagerContractClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let caller = Address::generate(&env);
        let agent = Address::generate(&env);

        env.mock_all_auths();

        client.initialize(&admin);
        client.approve_caller(&admin, &caller);

        // Set a good score
        client.update_score(&caller, &agent, &30);
        assert_eq!(client.get_score(&agent), 80);

        // Freeze the agent (fraud detected)
        client.freeze_reputation(&caller, &agent);
        assert_eq!(client.get_score(&agent), 0);
    }
}
