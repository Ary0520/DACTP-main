# 🔑 DACTP Delegated Wallet Service

**Safe On-Chain Delegation - Trustless Execution with Built-in Protection!**

This backend service executes scheduled repayment transactions using delegated wallet authority, completely constrained by DACTP protocol rules.

## 🎯 Core Principle: SAFE ON-CHAIN DELEGATION

DACTP is about **SAFE ON-CHAIN DELEGATION**, not AI intelligence.

- **Backend Authority**: Backend does NOT decide when to repay or monitor loans as business logic
- **Backend Role**: Backend MAY only trigger repay_loan transactions and sign them
- **All Logic On-Chain**: Smart contracts enforce ALL rules (authorization, permissions, limits, delegation status)
- **Simple Automation**: Keep only node-cron as trigger, no monitoring dashboards or intelligence claims

## 🚀 Features

- **⚡ Scheduled Execution**: Executes repay_loan transactions on schedule
- **🛡️ Trustless Security**: All actions are constrained by smart contract rules
- **🔄 Simple Automation**: Pure execution trigger with no business logic
- **🎯 Revocable**: Users can instantly revoke agent permissions

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │ Delegated Wallet │    │   Contracts     │
│                 │    │   Service        │    │                 │
│ • Register Agent│───▶│ • Execute Repay  │───▶│ • Check Auth    │
│ • Show Status   │    │ • Sign Tx        │    │ • Update Rep    │
│ • Revoke Agent  │    │ • Simple Cron    │    │ • Enforce Rules │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🛠️ Installation

```bash
# Clone and install dependencies
cd dactp-agent-service
npm install

# Copy environment configuration
cp .env.example .env

# Edit .env with your configuration
nano .env
```

## ⚙️ Configuration

Edit `.env` file:

```bash
# Delegated Wallet (Backend Service Keypair)
AGENT_SECRET_KEY=your_agent_secret_key_here

# DACTP Contract Addresses
AGENT_MANAGER_CONTRACT=your_agent_manager_contract
REPUTATION_MANAGER_CONTRACT=your_reputation_manager_contract
LENDING_DEMO_CONTRACT=your_lending_demo_contract

# Execution Configuration
CHECK_INTERVAL_MINUTES=60
```

## 🚀 Usage

### Start the Service

```bash
npm start
```

### Development Mode

```bash
npm run dev
```

### Check Service Status

```bash
curl http://localhost:3001/status
```

## 📊 API Endpoints

### GET /status
Returns current service status and statistics.

## 🎯 How It Works

1. **User Delegates**: User registers delegated wallet with "repay_loan" permission
2. **Service Executes**: Backend service executes repay_loan transactions on schedule
3. **Contract Enforces**: Smart contracts enforce all authorization rules
4. **Reputation Updates**: Successful repayments increase reputation

## 🛡️ Security Features

- **Scoped Permissions**: Delegated wallet can only perform authorized actions
- **Amount Limits**: Delegated wallet cannot exceed spending limits
- **Instant Revocation**: Users can revoke delegation permissions anytime
- **Contract Enforcement**: All rules enforced by smart contracts

## 🔧 Development

### Project Structure

```
dactp-agent-service/
├── index.js          # Main service implementation
├── package.json      # Dependencies and scripts
├── .env.example      # Environment configuration template
└── README.md         # This file
```

### Key Components

- **Scheduled Execution**: Cron-based scheduling for regular execution
- **Contract Interaction**: Stellar SDK integration for blockchain calls
- **Simple Logging**: Basic error logging and status tracking

## 🎪 Demo Flow

Perfect for presentations:

1. **"I delegate to my wallet service"** → Show delegation registration
2. **"Service executes on schedule"** → Show service logs
3. **"Service repays on time"** → Show automatic transaction
4. **"Reputation increases"** → Show score update
5. **"Contract protects me"** → Show revocation works

## 🚀 Production Deployment

For production use:

1. **Secure Key Management**: Use proper secret management
2. **Simple Logging**: Set up proper logging
3. **Scaling**: Consider multiple service instances for redundancy

## 📝 License

MIT License - Build the future of DeFi! 🚀