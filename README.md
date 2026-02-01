# 🛰️ DACTP
### Decentralized Agentic Compliance & Trust Protocol
> Making **trust** programmable on Stellar.

---

## 🌌 What Is DACTP?

DACTP is a Soroban-native trust and delegation layer that brings on-chain reputation, safe automation, and under-collateralized finance to the Stellar ecosystem.
It is a **protocol, not just a product**: any Stellar dApp can plug into DACTP to inherit standardized reputation and scoped agent permissions.

---

## 🧠 Why DeFi Needs DACTP

Traditional finance runs on three pillars: trust, delegation, and behavioral history.
In Web3, most systems are blind to user history, forcing over-collateralization and making automation dangerously all-or-nothing.

**Current pain points:**
- Capital-inefficient over-collateralization for simple borrowing.
- No portable, protocol-level reputation across dApps.
- Unsafe automation that often requires sharing full key control or unlimited approvals.

**Result:** a “trustless” system that is actually **trust-starved**, blocking SME lending, micro-finance, and agentic use cases.

DACTP fixes this by answering one fundamental question for every on-chain interaction:

> “Is this agent allowed to perform this action, and do they have the reputation to back it up?”

---

## 💎 Core Primitives

### 1. On-Chain Reputation

DACTP introduces a 0–100, protocol-level reputation score for agents, defaulting to 50 (neutral).
Scores move deterministically based on real financial outcomes reported by integrated contracts.

- Default: 50 / 100
- Trust building: slow (+5 on successful repayment)
- Trust loss: fast (−15 on default)
- Fraud: instant freeze to 0

There is no centralized oracle: only approved consumer contracts (like lending pools) can update scores.

### 2. Scoped, Revocable Agents

Users can register agents (bots, scripts, services) bound to an owner with tightly scoped capabilities and limits.

- Define **scopes** (e.g. `borrow`, `repay_loan`, `loan_repayment`).
- Set **max_amount** per agent to cap risk.
- Instantly revoke misbehaving agents on-chain.

This enables “limited trust” automation: an AI or script can repay loans or manage positions without ever touching full wallet keys.

---

## 🧩 Protocol Architecture

DACTP is implemented as real Soroban contracts (no mocks) plus a reference lending dApp.

### 🧱 Contracts

| Layer                 | Contract                    | Role                             |
|-----------------------|----------------------------|----------------------------------|
| Identity & Permissions| `AgentManager`             | Agent ownership, scopes, limits. |
| Credit Bureau         | `ReputationManager`        | Reputation storage & rules.      |
| Consumer dApp         | `LendingDemo`              | Reputation-gated lending.        |

#### 1. AgentManager (`dactp-protocol/contracts/agent-manager`)

The **Identity & Permission** layer.
It never holds funds; it only decides whether an agent is allowed to act.

Key responsibilities:
- Register new agents linked to an owner.
- Store scopes and spending limits.
- Evaluate `is_authorized(agent, action, amount)`.
- Enforce revocation and expose agent metadata for UIs.

#### 2. ReputationManager (`dactp-protocol/contracts/reputation-manager`)

The on-chain **Credit Bureau**.

Key features:
- Per-agent `u32` score (0–100, default 50).
- `get_score(agent)` for any integrated dApp.
- `update_score(agent, delta)` callable only by approved contracts.
- `freeze_reputation(agent)` for fraud or abuse.

Rules:
- 0 = frozen, 50 = neutral, 100 = excellent.
- All updates derive from **real** outcomes (repayments, defaults).

#### 3. LendingDemo (`dactp-protocol/contracts/lending-demo`)

A live reference consumer demonstrating under-collateralized lending on Stellar using DACTP.

For each loan request, it:
- Verifies the caller is a valid registered agent.
- Checks scopes & amount via `AgentManager`.
- Ensures `ReputationManager` score ≥ 60.
- Issues a loan **without** requiring 150% collateral when trust is earned.

On repayment, it triggers a +5 reputation increase; on default, it can penalize or freeze.

---

## 🧭 Live Contracts (Testnet)

These contract IDs are deployed on the Stellar test environment for the main demo flow.

- **Agent Manager:**
  `CD4L232BN5LS537F23LF4GAL53I6GV6JDKYQ73B6HE4YY6S6OZR3MS4R`
- **Reputation Manager:**
  `CDWF4BNN2GTUHDKRBPSUA7K6NTIS75YYVHBSFFFDGWPWU635GZY6PHEN`
- **Lending Demo (Main):**
  `CD4ZOPXBNM7NV5FVY2L2ZW4TKLDC4B4CKHE3II5VCA743CPKFMH3N4WM`
- **XLM Token Contract:**
  `CB64D3G7SM2RTH6JSGG34DDTFTQ5CFDKVDZJZSODMCX4NJ2HV2KN7OHT`

---

## 🏗 Project Layout

The repository is structured as a full-stack, protocol-first system with contracts, SDK, and services.

```text
DACTP/
├── dactp-protocol/          # Soroban smart contracts (core protocol)
│   ├── contracts/
│   │   ├── agent_manager/   # Identity & permissions
│   │   ├── reputation_manager/  # Reputation & history
│   │   └── lending_demo/    # Reference lending consumer
│   └── tests/               # Integrated protocol tests
│
├── dactp-sdk/               # Client SDK & helpers
├── dactp-agent-service/     # Off-chain automation / agent runner
├── dactp-frontend/          # React + Vite + Freighter-based UI
└── *.md / *.txt             # Architecture, flows, fixes, and guides
```

## ⚙️ Getting Started

### Prerequisites
- Node.js v18+
- Rust & Cargo
- Soroban / Stellar CLI
- Freighter wallet browser extension

### 1. Build & Test the Protocol

```bash
cd dactp-protocol

# Build Soroban contracts
cargo build --target wasm32v1-none --release

# Run tests
cargo test
```
Contracts are emitted under `target/wasm32v1-none/release/*.wasm`.

### 2. Deploy Contracts (Testnet)

High-level deployment flow:
1. Deploy AgentManager
2. Deploy ReputationManager
3. Initialize ReputationManager with admin
4. Deploy LendingDemo
5. Initialize LendingDemo with links to Agent & Reputation managers
6. Approve LendingDemo as an authorized reputation updater

Concrete CLI commands are outlined in `dactp-protocol/README.md`.

### 3. Run the Frontend

```bash
cd dactp-frontend
npm install
npm run dev
```
Then open http://localhost:5173 and connect with Freighter to start interacting with the demo.

## 🧪 End-to-End User Journey

Follow this in the LendingDemo UI to see DACTP in action.

### Connect & Register Agent
1. Connect wallet (principal).
2. Register a new agent address.
3. Grant scope like `loan_repayment` or `borrow` with a max spend limit.

### Reputation Gate
- New agents start at score 50.
- Lending requires score ≥ 60 to qualify for under-collateralized loans.

### Build Trust
- Take small, fully collateralized “trust-building” loans or perform other positive actions.
- Each successful repayment nudges reputation upward: 50 → 55 → 60.

### Unlock Under-Collateralized Credit
- Once score > 60, your agent can request an under-collateralized loan.
- LendingDemo consults AgentManager (permissions) and ReputationManager (score) before issuing funds.

Reputation is now a reusable, enforceable primitive that any future dApp can rely on.

## 🛰 For Developers

### Key Contract Interfaces (Conceptual)

**AgentManager**
- `register_agent(owner, agent, scopes, max_amount)`
- `revoke_agent(owner, agent)`
- `is_authorized(agent, action, amount) -> bool`
- `get_agent_info(agent)`

**ReputationManager**
- `initialize(admin)`
- `approve_caller(admin, caller)`
- `get_score(agent) -> u32`
- `update_score(caller, agent, delta)`
- `freeze_reputation(caller, agent)`

**LendingDemo**
- `initialize(admin, agent_mgr, rep_mgr)`
- `request_loan(agent, amount)`
- `repay_loan(agent)`
- `report_default(admin, agent)`

Any Soroban dApp (lending, insurance, gig marketplaces, rentals, etc.) can consume these surfaces to make reputation-enforced decisions.

## 🔮 Roadmap

DACTP is designed to evolve into a generalized trust fabric for agentic systems on Stellar.

Planned extensions:
- Social recovery for agent control via guardians.
- Multi-sig / DAO-controlled agents.
- Cross-chain export of DACTP scores via bridges.
- Plug-and-play reputation hooks for any dApp vertical (insurance, gigs, rent, marketplaces).

## 📜 License

DACTP is released under the MIT License and is open for teams to fork, extend, or integrate directly into production systems.

If your dApp needs under-collateralized credit, accountable agents, or programmable trust on Stellar, DACTP is your base layer.
