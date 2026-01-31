#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, String, Vec};

/// Agent represents a delegated actor with bounded authority
#[contracttype]
#[derive(Clone)]
pub struct AgentInfo {
    pub owner: Address,        // The address that owns/controls this agent
    pub scopes: Vec<String>,   // Permitted actions (e.g., "repay_loan", "borrow")
    pub max_amount: u64,       // Maximum amount the agent can handle
    pub revoked: bool,         // Whether this agent has been permanently disabled
}

/// Storage keys for agent data
#[contracttype]
pub enum DataKey {
    Agent(Address), // Maps agent address -> AgentInfo
}

#[contract]
pub struct AgentManagerContract;

#[contractimpl]
impl AgentManagerContract {
    /// Register a new agent with specific permissions and limits
    /// Only the owner can register an agent
    pub fn register_agent(
        env: Env,
        owner: Address,
        agent: Address,
        scopes: Vec<String>,
        max_amount: u64,
    ) {
        // Require owner authorization - this ensures only the owner can register agents
        owner.require_auth();

        // Create agent info
        let agent_info = AgentInfo {
            owner: owner.clone(),
            scopes,
            max_amount,
            revoked: false,
        };

        // Store agent info in persistent storage
        let key = DataKey::Agent(agent.clone());
        env.storage().persistent().set(&key, &agent_info);
    }

    /// Revoke an agent permanently - only callable by the owner
    pub fn revoke_agent(env: Env, owner: Address, agent: Address) {
        // Require owner authorization
        owner.require_auth();

        // Get existing agent info
        let key = DataKey::Agent(agent.clone());
        let mut agent_info: AgentInfo = env
            .storage()
            .persistent()
            .get(&key)
            .expect("Agent not found");

        // Verify the caller is the actual owner
        if agent_info.owner != owner {
            panic!("Unauthorized: only the agent owner can revoke");
        }

        // Mark as revoked
        agent_info.revoked = true;

        // Update storage
        env.storage().persistent().set(&key, &agent_info);
    }

    /// Check if an agent is authorized to perform an action with a specific amount
    /// This is called by consumer contracts to verify agent permissions
    /// Returns true if authorized, false otherwise
    pub fn is_authorized(env: Env, agent: Address, action: String, amount: u64) -> bool {
        let key = DataKey::Agent(agent.clone());
        
        // Get agent info, return false if not found
        let agent_info: Option<AgentInfo> = env.storage().persistent().get(&key);
        
        match agent_info {
            None => false, // Agent not registered
            Some(info) => {
                // Check if revoked
                if info.revoked {
                    return false;
                }

                // Check if amount exceeds limit
                if amount > info.max_amount {
                    return false;
                }

                // Check if action is in permitted scopes
                let mut has_scope = false;
                for scope in info.scopes.iter() {
                    if scope == action {
                        has_scope = true;
                        break;
                    }
                }

                has_scope
            }
        }
    }

    /// Get agent information (for UI display)
    pub fn get_agent_info(env: Env, agent: Address) -> Option<AgentInfo> {
        let key = DataKey::Agent(agent);
        env.storage().persistent().get(&key)
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{vec, Env};
    use soroban_sdk::testutils::Address as _;

    #[test]
    fn test_register_and_check_agent() {
        let env = Env::default();
        let contract_id = env.register(AgentManagerContract, ());
        let client = AgentManagerContractClient::new(&env, &contract_id);

        let owner = Address::generate(&env);
        let agent = Address::generate(&env);

        // Mock auth for testing
        env.mock_all_auths();

        // Register agent with "repay_loan" scope and 1000 XLM limit
        let scopes = vec![&env, String::from_str(&env, "repay_loan")];
        client.register_agent(&owner, &agent, &scopes, &1000);

        // Check authorization - should succeed
        assert!(client.is_authorized(&agent, &String::from_str(&env, "repay_loan"), &500));

        // Check with amount exceeding limit - should fail
        assert!(!client.is_authorized(&agent, &String::from_str(&env, "repay_loan"), &2000));

        // Check with wrong scope - should fail
        assert!(!client.is_authorized(&agent, &String::from_str(&env, "borrow"), &100));
    }

    #[test]
    fn test_revoke_agent() {
        let env = Env::default();
        let contract_id = env.register(AgentManagerContract, ());
        let client = AgentManagerContractClient::new(&env, &contract_id);

        let owner = Address::generate(&env);
        let agent = Address::generate(&env);

        env.mock_all_auths();

        // Register agent
        let scopes = vec![&env, String::from_str(&env, "repay_loan")];
        client.register_agent(&owner, &agent, &scopes, &1000);

        // Verify it's authorized
        assert!(client.is_authorized(&agent, &String::from_str(&env, "repay_loan"), &500));

        // Revoke the agent
        client.revoke_agent(&owner, &agent);

        // Verify it's no longer authorized
        assert!(!client.is_authorized(&agent, &String::from_str(&env, "repay_loan"), &500));
    }
}
