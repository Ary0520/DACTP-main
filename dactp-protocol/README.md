# DACTP - Decentralized Agentic Compliance & Trust Protocol

**IMPORTANT**: DACTP is a **PROTOCOL**, not a consumer application.

## What is DACTP?

DACTP is a Soroban-native trust and delegation layer for Stellar that enables:
1. **On-chain reputation** as a first-class primitive (0-100 score, default 50)
2. **Revocable, scoped agent delegation** with explicit permissions
3. **Deterministic reputation updates** based on real financial behavior
4. **A reusable protocol** that any Stellar dApp can integrate

## Problem Being Solved

Current DeFi limitations:
- Over-collateralization is mandatory
- No persistent, cross-app reputation
- No native delegation with accountability
- No way to express "limited trust" on-chain

This blocks:
- Under-collateralized lending
- Credit-based financial primitives
- Agent-driven automation with accountability

## Architecture

### Core Protocol Contracts (NO MOCKS, ALL REAL)

#### 1. AgentManager Contract
**Purpose**: Manages agent identity, ownership, permissions, and revocation

**Key Functions**:
- `register_agent(owner, agent, scopes, max_amount)` - Register a new agent with bounded authority
- `revoke_agent(owner, agent)` - Permanently disable an agent
- `is_authorized(agent, action, amount) -> bool` - Check if agent can perform action
- `get_agent_info(agent) -> AgentInfo` - Get agent details for UI

**Storage**: Each agent stores `owner`, `scopes` (permitted actions), `max_amount` (spending limit), `revoked` flag

#### 2. ReputationManager Contract
**Purpose**: Tracks on-chain reputation scores for agents

**Key Functions**:
- `initialize(admin)` - Set up the contract with admin
- `approve_caller(admin, caller)` - Approve contracts that can update scores
- `get_score(agent) -> u32` - Get reputation score (0-100, default 50)
- `update_score(caller, agent, delta)` - Update score based on real outcomes
- `freeze_reputation(caller, agent)` - Set score to 0 for fraud

**Reputation Rules**:
- Default score: 50 (neutral, unproven)
- Min score: 0 (frozen/fraudulent)
- Max score: 100 (excellent history)
- Updates triggered ONLY by real financial outcomes

#### 3. LendingDemo Contract (Reference Consumer)
**Purpose**: Proves DACTP works by implementing reputation-gated lending

**Key Functions**:
- `initialize(admin, agent_mgr, rep_mgr)` - Connect to DACTP contracts
- `request_loan(agent, amount) -> bool` - Borrow if reputation >= 60 and authorized
- `repay_loan(agent)` - Repay loan, triggers +5 reputation
- `report_default(admin, agent)` - Report missed payment, triggers -15 reputation

**Requirements for Loan Approval**:
1. Agent must be registered via AgentManager
2. Agent must have "borrow" scope permission
3. Amount must be within agent's max_amount limit  
4. Agent reputation must be >= 60
5. No existing unpaid loans

## Building the Contracts

### Prerequisites
- Rust v1.84.0 or higher
- Stellar CLI v25.0.0 or higher
- wasm32v1-none target: `rustup target add wasm32v1-none`

### Build Commands

```bash
# Build all contracts
cd dactp-protocol
cargo build --target wasm32v1-none --release

# Contracts will be in:
# - target/wasm32v1-none/release/agent_manager.wasm
# - target/wasm32v1-none/release/reputation_manager.wasm  
# - target/wasm32v1-none/release/lending_demo.wasm
```

### Run Tests

```bash
cargo test
```

## Deployment Flow

1. **Deploy AgentManager**
   ```bash
   stellar contract deploy \
     --wasm target/wasm32v1-none/release/agent_manager.wasm \
     --network testnet
   ```

2. **Deploy ReputationManager**
   ```bash
   stellar contract deploy \
     --wasm target/wasm32v1-none/release/reputation_manager.wasm \
     --network testnet
   ```

3. **Initialize ReputationManager**
   ```bash
   stellar contract invoke \
     --id <REPUTATION_MANAGER_ID> \
     --network testnet \
     -- initialize --admin <ADMIN_ADDRESS>
   ```

4. **Deploy LendingDemo**
   ```bash
   stellar contract deploy \
     --wasm target/wasm32v1-none/release/lending_demo.wasm \
     --network testnet
   ```

5. **Initialize LendingDemo**
   ```bash
   stellar contract invoke \
     --id <LENDING_DEMO_ID> \
     --network testnet \
     -- initialize \
       --admin <ADMIN_ADDRESS> \
       --agent-manager-contract <AGENT_MANAGER_ID> \
       --reputation-manager-contract <REPUTATION_MANAGER_ID>
   ```

6. **Approve LendingDemo to Update Reputation**
   ```bash
   stellar contract invoke \
     --id <REPUTATION_MANAGER_ID> \
     --network testnet \
     -- approve_caller \
       --admin <ADMIN_ADDRESS> \
       --caller <LENDING_DEMO_ID>
   ```

## Usage Example

### 1. Register an Agent
```bash
stellar contract invoke \
  --id <AGENT_MANAGER_ID> \
  --network testnet \
  -- register_agent \
    --owner <OWNER_ADDRESS> \
    --agent <AGENT_ADDRESS> \
    --scopes '[\"borrow\", \"repay_loan\"]' \
    --max-amount 1000
```

### 2. Request a Loan
```bash
stellar contract invoke \
  --id <LENDING_DEMO_ID> \
  --network testnet \
  -- request_loan \
    --agent <AGENT_ADDRESS> \
    --amount 500
```
This will:
- Check if agent is authorized for "borrow" action
- Check if amount (500) is within max_amount (1000)
- Check if reputation >= 60
- Issue loan if all checks pass

### 3. Repay the Loan
```bash
stellar contract invoke \
  --id <LENDING_DEMO_ID> \
  --network testnet \
  -- repay_loan \
    --agent <AGENT_ADDRESS>
```
This will:
- Verify agent is authorized for "repay_loan" action
- Mark loan as repaid
- **Trigger real +5 reputation increase** on ReputationManager

### 4. Check Reputation
```bash
stellar contract invoke \
  --id <REPUTATION_MANAGER_ID> \
  --network testnet \
  -- get_score \
    --agent <AGENT_ADDRESS>
```

## Frontend Integration (Next Steps)

The demo frontend will use:
- **React** for UI
- **Freighter wallet** for transaction signing
- **Stellar JS SDK** for contract interaction
- **Testnet/Futurenet** for deployment

UI will display:
- Agent registration form
- Agent dashboard (status, reputation, revoked state)
- Lending interface (request loan, repay, see reputation updates live)

**ALL DATA COMES FROM CONTRACTS - NO MOCKS**

## What Makes This Different

✅ **Reputation is enforceable**, not cosmetic  
✅ **Delegation is permissioned** and revocable  
✅ **Trust is protocol-level**, not app-level  
✅ **Enables under-collateralized finance** without custody or oracles  
✅ **Built on Stellar/Soroban** - ultra-low fees, fast finality  

## License

MIT
