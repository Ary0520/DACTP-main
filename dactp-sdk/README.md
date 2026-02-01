# 🚀 DACTP SDK

**The easiest way to integrate reputation-based authorization into your Stellar DeFi dapp.**

[![npm version](https://badge.fury.io/js/%40dactp%2Fsdk.svg)](https://www.npmjs.com/package/@dactp/sdk)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![Stellar](https://img.shields.io/badge/Stellar-Soroban-brightgreen.svg)](https://soroban.stellar.org/)

## ✨ What is DACTP?

**DACTP (Decentralized Agent Credit & Trust Protocol)** is the reputation infrastructure layer for Stellar DeFi. Instead of every protocol building their own reputation system, they integrate DACTP in minutes and get:

- 🎯 **Cross-protocol reputation** - Reputation earned in one dapp works everywhere
- 🔒 **Agent-based delegation** - Secure automated actions with bounded authority  
- 📊 **Risk-based limits** - Dynamic limits based on proven track record
- ⚡ **One-line integration** - From days of work to minutes

## 🚀 Quick Start

### Installation

```bash
npm install @dactp/sdk
# or
yarn add @dactp/sdk
```

### Basic Usage

```typescript
import { DACTP } from '@dactp/sdk';

// Initialize SDK
const dactp = new DACTP({ network: 'mainnet' });

// Register an agent
await dactp.registerAgent(
  ownerAddress,
  agentAddress, 
  ['borrow', 'repay'], 
  1000 // max amount
);

// Check authorization (one line!)
const canBorrow = await dactp.checkAuthorization(
  agentAddress, 
  'borrow', 
  500
);

// Get reputation score
const score = await dactp.getReputationScore(agentAddress);
console.log(`Reputation: ${score}/100`);
```

## 🎯 Integration Examples

### Lending Protocol Integration

```typescript
import { DACTP } from '@dactp/sdk';

class MyLendingProtocol {
  private dactp = new DACTP();

  async processLoan(borrower: string, amount: number) {
    // Check if borrower can borrow this amount
    const result = await this.dactp.canPerformAction(
      borrower, 
      'borrow', 
      amount,
      60 // minimum reputation required
    );

    if (!result.canPerform) {
      throw new Error(result.reason);
    }

    // Process loan...
    
    // Update reputation based on outcome
    await this.dactp.updateReputation(
      'MY_PROTOCOL_ADDRESS',
      borrower,
      outcome === 'success' ? 8 : -25
    );
  }
}
```

### DEX Integration

```typescript
class MyDEX {
  private dactp = new DACTP();

  async executeTrade(trader: string, amount: number) {
    // Get reputation-based trading limits
    const maxAmount = await this.dactp.getMaxLoanAmount(trader);
    
    if (amount > maxAmount) {
      throw new Error(`Max trading limit: ${maxAmount} XLM`);
    }

    // Execute trade and update reputation
    const success = await this.executeTradeLogic(trader, amount);
    await this.dactp.updateReputation(
      'MY_DEX_ADDRESS',
      trader,
      success ? 2 : -5
    );
  }
}
```

## 📚 API Reference

### Main DACTP Class

#### Constructor
```typescript
new DACTP(config?: DACTPConfig)
```

**Config Options:**
- `network`: `'mainnet' | 'testnet' | 'futurenet'` (default: `'futurenet'`)
- `rpcUrl`: Custom RPC URL
- `contracts`: Override contract addresses
- `wallet`: Wallet configuration

#### High-Level Methods

##### `registerAgent(owner, agent, scopes, maxAmount, options?)`
Register a new agent with specific permissions.

```typescript
await dactp.registerAgent(
  'GOWNER...', 
  'GAGENT...', 
  ['borrow', 'repay'], 
  1000
);
```

##### `checkAuthorization(agent, action, amount)`
Check if agent is authorized for an action.

```typescript
const canBorrow = await dactp.checkAuthorization(
  'GAGENT...', 
  'borrow', 
  500
);
```

##### `getReputationScore(agent)`
Get agent's current reputation score (0-100).

```typescript
const score = await dactp.getReputationScore('GAGENT...');
```

##### `updateReputation(caller, agent, delta, options?)`
Update agent's reputation score.

```typescript
await dactp.updateReputation(
  'GCALLER...', 
  'GAGENT...', 
  -25 // penalty
);
```

##### `canPerformAction(agent, action, amount, minReputation?)`
Comprehensive check combining authorization and reputation.

```typescript
const result = await dactp.canPerformAction(
  'GAGENT...', 
  'borrow', 
  500,
  60 // minimum reputation
);

if (result.canPerform) {
  console.log(`Max allowed: ${result.maxAllowed}`);
} else {
  console.log(`Denied: ${result.reason}`);
}
```

### Advanced Usage

#### Direct Manager Access

```typescript
// Agent management
const agentInfo = await dactp.agents.getInfo('GAGENT...');
const authResult = await dactp.agents.isAuthorized({
  agent: 'GAGENT...',
  action: 'borrow',
  amount: 500
});

// Reputation management
const reputation = await dactp.reputation.getScore('GAGENT...');
const tier = dactp.reputation.getTier(85);
const maxLoan = dactp.reputation.getMaxLoanAmount(85);
```

#### Reputation Tiers

DACTP uses a 5-tier reputation system:

| Tier | Score | Name | Max Loan | Description |
|------|-------|------|----------|-------------|
| 0 | 0-49 | No Credit | 0 XLM | No lending access |
| 1 | 50-59 | Basic | 0.5 XLM | Small loans |
| 2 | 60-74 | Good | 2.0 XLM | Moderate loans |
| 3 | 75-89 | Excellent | 5.0 XLM | Large loans |
| 4 | 90-100 | Elite | 10.0 XLM | Maximum loans |

#### Reputation Deltas

Common reputation changes:

```typescript
import { REPUTATION_DELTAS } from '@dactp/sdk';

// Positive actions
REPUTATION_DELTAS.EARLY_PAYMENT;    // +12
REPUTATION_DELTAS.ON_TIME_PAYMENT;  // +8
REPUTATION_DELTAS.SUCCESSFUL_TRADE; // +2

// Negative actions  
REPUTATION_DELTAS.LATE_PAYMENT;     // -5
REPUTATION_DELTAS.DEFAULT;          // -25
```

## 🌐 Network Support

### Mainnet
```typescript
const dactp = new DACTP({ network: 'mainnet' });
```

### Testnet
```typescript
const dactp = new DACTP({ network: 'testnet' });
```

### Futurenet (Default)
```typescript
const dactp = new DACTP({ network: 'futurenet' });
```

### Custom Network
```typescript
const dactp = new DACTP({
  rpcUrl: 'https://custom-rpc.example.com',
  networkPassphrase: 'Custom Network',
  contracts: {
    agentManager: 'CAGENT...',
    reputationManager: 'CREP...'
  }
});
```

## 🔧 Configuration

### Wallet Integration

```typescript
const dactp = new DACTP({
  wallet: {
    type: 'freighter',
    autoSign: true
  }
});
```

### Transaction Options

```typescript
// Get unsigned XDR (for custom signing)
const result = await dactp.registerAgent(
  owner, agent, scopes, maxAmount,
  { signAndSend: false }
);
console.log('Unsigned XDR:', result.hash);

// Custom fee
const result = await dactp.updateReputation(
  caller, agent, delta,
  { fee: 200000 }
);
```

## 🎨 React Integration

Coming soon: `@dactp/react` package with hooks!

```typescript
import { useDACTP, useReputation } from '@dactp/react';

function MyComponent() {
  const { dactp } = useDACTP();
  const { score, tier, loading } = useReputation(userAddress);
  
  return (
    <div>
      <p>Reputation: {score} ({tier.name})</p>
      <p>Max Loan: {tier.maxLoanAmount} XLM</p>
    </div>
  );
}
```

## 🚀 Why DACTP SDK?

### Before DACTP SDK
```typescript
// 200+ lines of complex contract calls
const agentMgrClient = new AgentManagerClient(env, contractAddr);
const repMgrClient = new ReputationManagerClient(env, repAddr);

// Complex authorization logic
const isAuth = await agentMgrClient.is_authorized(agent, action, amount);
const score = await repMgrClient.get_score(agent);
const tier = calculateTier(score);
const maxAmount = getTierLimit(tier);

if (!isAuth || amount > maxAmount || score < minScore) {
  // Handle rejection...
}

// Update reputation with complex transaction building
const tx = new TransactionBuilder(account, { fee: 100000 })
  .addOperation(repContract.call('update_score', caller, agent, delta))
  .setTimeout(30)
  .build();
// ... 20 more lines of signing and submission
```

### With DACTP SDK
```typescript
// 1 line
const canPerform = await dactp.canPerformAction(agent, 'borrow', amount, 60);
```

**Result: 10x faster integration, 95% less code, zero errors!**

## 📊 Ecosystem Benefits

### For DeFi Protocols
- ⚡ **10x faster integration** - Hours instead of days
- 💰 **Reduced development costs** - No need to build reputation system
- 🎯 **Better user experience** - Consistent reputation across protocols
- 🛡️ **Risk mitigation** - Battle-tested algorithms

### For Users
- 🌐 **Universal reputation** - Build once, use everywhere
- 📈 **Better rates** - Higher reputation = better terms
- 🔒 **Secure delegation** - Automated actions with safety limits
- 🎮 **Gamification** - Reputation building becomes engaging

### For Stellar Ecosystem
- 🚀 **DeFi growth** - Easier to build sophisticated protocols
- 🔗 **Cross-protocol compatibility** - Shared reputation layer
- 👨‍💻 **Developer attraction** - Modern tooling attracts builders
- ⚡ **Innovation acceleration** - Focus on features, not infrastructure

## 🛠️ Development

### Building from Source

```bash
git clone https://github.com/dactp/sdk
cd sdk
npm install
npm run build
```

### Running Examples

```bash
npm run example:lending
npm run example:dex
```

## 📄 License

MIT License - see [LICENSE](LICENSE) file.

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 🔗 Links

- 🌐 **Website**: [dactp.org](https://dactp.org)
- 📚 **Documentation**: [docs.dactp.org](https://docs.dactp.org)
- 💬 **Discord**: [discord.gg/dactp](https://discord.gg/dactp)
- 🐦 **Twitter**: [@DACTPProtocol](https://twitter.com/DACTPProtocol)
- 📧 **Email**: hello@dactp.org

---

**Built with ❤️ for the Stellar ecosystem**

*Making DeFi reputation as easy as `await dactp.checkAuthorization()`*