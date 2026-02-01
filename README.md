# Decentralized Agentic Compliance & Trust Protocol (DACTP)

> **A Soroban-native trust and delegation layer enabling under-collateralized finance and autonomous agents on Stellar.**

DACTP is a **protocol, not just a product**. It provides the fundamental infrastructure required to bring reputation, accountability, and secure delegation to the Stellar blockchain.

---

## 🌍 The Problem: Why DeFi is Stagnant

Modern financial systems rely heavily on **trust**, **delegation**, and **behavioral history**. If you want a loan today in the real world, the bank looks at your credit score (reputation) and income history.

**Web3 systems largely lack this.**

### Current Limitations
1.  **Mandatory Over-Collateralization:** To borrow $100, you must deposit $150. This is capital inefficient and blocks most real-world use cases (SME lending, Payday loans, Micro-finance).
2.  **No Persistent Reputation:** Your behavior on one dApp doesn't follow you to another. A user who has repaid 100 loans on time is treated exactly the same as a fresh wallet.
3.  **Unsafe Automation:** Giving a bot "access" to your wallet usually means giving it *all* your private keys or unlimited approval tokens. There is no middle ground for "safe, scoped delegation."

### The Consequence
Because we cannot trust users or agents, we force them to lock up more money than they borrow. This creates a "trustless" system that is paradoxically **trust-starved**, preventing mass adoption of blockchain for real financial utility.

---

## 🚀 The Solution: DACTP

**DACTP** (Decentralized Agentic Compliance & Trust Protocol) solves this by introducing **On-Chain Reputation** and **Scoped Delegation** as first-class primitives on Stellar.

It answers the single most important question for any interaction:
> *"Is this agent allowed to perform this action, and do they have the reputation to back it up?"*

### Core Value Props
*   **On-Chain Reputation:** A 0-100 score that updates deterministically based on financial outcomes (repayment = score up, default = score down).
*   **Scoped Delegation:** Users can create agents (bots/scripts) with specific permissions (e.g., "Can only repay loans", "Max spend 10 XLM").
*   **Revocability:** Agents can be instantly revoked on-chain, cutting off access immediately.
*   **No Central Oracle:** Reputation updates are triggered by the logic of the consuming contract itself (e.g., the lending pool reports the repayment), not by a centralized admin.

---

## ⚙️ Technical Architecture

DACTP is built on **Stellar Soroban** and consists of two core smart contracts and a reference implementation.

### 1. AgentManager Contract (`dactp-protocol/contracts/agent-manager`)
*   **Role:** The "Identity & Permission" layer.
*   **Functionality:**
    *   Registers new agents linked to a user (Owner).
    *   Stores permissions (Scopes) and spending limits.
    *   Handles `is_authorized(agent, action, amount)` checks.
    *   Enforces Agent Revocation.
*   **Key Logic:** It never holds funds. It only allows/denies actions based on the state.

### 2. ReputationManager Contract (`dactp-protocol/contracts/reputation-manager`)
*   **Role:** The "Credit Bureau" layer.
*   **Functionality:**
    *   Stores the reputation score (`u32`) for every agent.
    *   Default Score: **50/100**.
    *   Exposes `update_score(agent, delta)` to *approved consumer contracts* only.
*   **Mechanic:**
    *   **Trust Building:** Slow. (+5 for repayment).
    *   **Trust Loss:** Fast. (-15 for default).
    *   **Fraud:** Instant Freeze.

### 3. LendingDemo Contract (Reference Implementation)
*   **Role:** Proving the protocol works.
*   **Functionality:**
    *   An under-collateralized lending pool.
    *   **Crucial Step:** It consults `AgentManager` to check if the caller is a valid agent.
    *   **Crucial Step:** It consults `ReputationManager` to check if the agent's score is > 60.
    *   If both pass, it issues a loan *without requiring 150% collateral*.
    *   On repayment, it calls `ReputationManager` to boost the agent's score.

---

## 🛠 Project Structure

```bash
DACTP/
├── dactp-protocol/          # Rust/Soroban Smart Contracts
│   ├── contracts/
│   │   ├── agent_manager/   # Core: Identity & Permissions
│   │   ├── reputation_manager/ # Core: Scoring & History
│   │   └── lending_demo/    # Example: Uses the protocol
│   └── tests/               # Integrated test suite
│
├── dactp-frontend/          # React + Vite + Freighter Wallet
│   ├── src/
│   │   ├── components/      # UI Components
│   │   ├── services/        # Soroban Client wrappers
│   ├── ...
```

---

## 🏃 Getting Started

### Prerequisites
*   Node.js (v18+)
*   Rust & Cargo
*   Soroban CLI
*   Freighter Wallet Extension

### 1. Protocols & Contracts
Build and test the contracts to ensure logic is sound.

```bash
cd dactp-protocol
cargo build
cargo test
```

To deploy (requires standalone Soroban or Testnet account):
> *See `dactp-protocol/README.md` for detailed deployment scripts.*

### 2. Frontend
Run the reference web interface.

```bash
cd dactp-frontend
npm install
npm run dev
```
Open `http://localhost:5173` (or the port shown).

---

## 🧪 User Journey (The Demo)

To understand DACTP, follow this flow in the `LendingDemo`:

1.  **Agent Registration:**
    *   User connects wallet (The "Principal").
    *   User registers a new Agent Address.
    *   User grants scope: `loan_repayment`.

2.  **Reputation Check:**
    *   The new agent starts with a score of **50**.
    *   The Lending Protocol requires a score of **60** to borrow.

3.  **Building Trust:**
    *   The Agent takes small, fully-collateralized "trust-building" loans (if supported) or performs other reputation-building actions.
    *   Upon successful completion, the score ticks up: 50 -> 55 -> 60.

4.  **The Payoff (Under-collateralized Loan):**
    *   Once Score > 60, the Agent requests an *under-collateralized* loan.
    *   `LendingDemo` checks `ReputationManager`.
    *   **Success!** The protocol trusts the historical behavior and issues funds.

---

## 🔮 Future Roadmap

*   **Social Recovery:** Allowing guardians to recover agent control.
*   **Multi-Sig Agents:** Agents controlled by a DAO or squad.
*   **Cross-Chain Reputation:** Exporting DACTP scores to other chains via bridges.
*   **Generalized Hooks:** Allowing any dApp (insurance, gigs, rent) to plug into the ReputationManager.

---

## 📜 License

MIT License. Open source and free to build upon.

> **DACTP**: Making Trust Programmable.
