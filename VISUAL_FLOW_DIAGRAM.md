# Visual Flow: Token Deposit Process

## ❌ **OLD (BROKEN) FLOW**

```
User Clicks "Deposit"
        ↓
Frontend calls: depositLiquidity(user, amount)
        ↓
Contract executes:
    xlm_client.transfer(&user, &contract, &amount)
        ↓
Token Contract checks: Does 'user' authorize this?
        ↓
    ❌ NO! The call came from LendingDemo contract, not from user
        ↓
    ERROR: UnreachableCodeReached
```

**Why it failed:**
- The token contract's `transfer()` expects the FROM address to authorize
- But the contract was calling it, not the user
- Authorization context mismatch → WASM trap

---

## ✅ **NEW (WORKING) FLOW**

```
User Clicks "Deposit"
        ↓
┌─────────────────────────────────────────────────────────┐
│ STEP 1: Approve                                         │
│                                                         │
│ Frontend calls: xlmToken.approve(                       │
│     user,                  // who is approving         │
│     lendingContract,       // who gets permission      │
│     amount,                // how much                 │
│     expiration             // when it expires          │
│ )                                                       │
│                                                         │
│ User signs transaction in Freighter                    │
│ ✅ Approval granted!                                    │
└─────────────────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────────────────┐
│ STEP 2: Deposit                                         │
│                                                         │
│ Frontend calls: lendingContract.deposit_liquidity(      │
│     user,                                              │
│     amount                                             │
│ )                                                       │
│                                                         │
│ Contract executes:                                      │
│     xlm_client.transfer_from(                          │
│         &contract,         // who is calling (spender) │
│         &user,             // where to pull from       │
│         &contract,         // where to send to         │
│         &amount            // how much                 │
│     )                                                   │
│                                                         │
│ Token Contract checks:                                  │
│   - Does contract have approval from user? ✅ YES!      │
│   - Is amount within approved limit? ✅ YES!            │
│   - Has approval expired? ✅ NO!                        │
│                                                         │
│ User signs transaction in Freighter                    │
│ ✅ Tokens transferred successfully!                     │
└─────────────────────────────────────────────────────────┘
        ↓
    SUCCESS! Liquidity deposited!
```

---

## 🔐 **SECURITY MODEL**

### Why Two Transactions?

```
Transaction 1 (Approve):
┌────────────────────────────────────────┐
│ "I, the user, grant permission to      │
│  LendingDemo contract to spend up to   │
│  1.0 XLM from my account until         │
│  ledger 535679"                        │
│                                        │
│  Signed: User                          │
└────────────────────────────────────────┘

Transaction 2 (Deposit):
┌────────────────────────────────────────┐
│ "I, the user, authorize LendingDemo    │
│  to execute deposit_liquidity which    │
│  will pull the approved XLM"           │
│                                        │
│  Signed: User                          │
│                                        │
│  + Contract executes transfer_from     │
│    using the approval from Tx 1        │
└────────────────────────────────────────┘
```

**Benefits:**
- ✅ User explicitly approves each step
- ✅ Contract can't take more than approved
- ✅ Approval can expire automatically
- ✅ User can revoke approval anytime
- ✅ Clear audit trail of all permissions

---

## 📊 **DATA FLOW DIAGRAM**

```
┌─────────────┐
│    User     │
│   Wallet    │
└──────┬──────┘
       │
       │ (1) approve(contract, amount)
       ↓
┌────────────────────┐
│   XLM Token        │
│   Contract         │
│                    │
│  Allowances:       │
│  user→lending: 1.0 │
└────────────────────┘
       ↑
       │ (2) transfer_from(user, contract, amount)
       │
┌────────────────────┐
│  LendingDemo       │
│  Contract          │
│                    │
│  Liquidity: 1.0    │
└────────────────────┘
```

**State Changes:**
1. After approve: XLM Token stores allowance[user][lending] = 1.0 XLM
2. After deposit: 
   - XLM Token decreases allowance[user][lending] by 1.0
   - XLM Token moves 1.0 XLM from user to lending contract
   - LendingDemo records the deposit

---

## 🆚 **COMPARISON WITH OTHER PATTERNS**

### Pattern 1: Direct Transfer (What we TRIED to do - DOESN'T WORK)
```rust
// ❌ DOESN'T WORK for contracts pulling from users
token.transfer(&user, &contract, &amount)
```
**Use case:** User directly sending tokens (not from a contract)

### Pattern 2: Approve + Transfer From (What we NOW use - ✅ WORKS)
```rust
// ✅ CORRECT for contracts pulling from users
// Step 1: User calls
token.approve(&user, &contract, &amount, &expiration)

// Step 2: Contract calls
token.transfer_from(&contract, &user, &contract, &amount)
```
**Use case:** Contract receiving tokens from users

### Pattern 3: Simple Transfer from Contract (For withdrawals)
```rust
// ✅ WORKS when contract sends its own tokens
token.transfer(&contract, &user, &amount)
```
**Use case:** Contract sending its own tokens to users

---

## 📖 **OFFICIAL STELLAR DOCUMENTATION**

From Stellar Soroban docs:

> **Token Interface - transfer_from**
>
> "This allows the contract to move tokens from a user's account after 
>  the user has authorized it via the approve function. If the user has 
>  not provided necessary allowance, the transfer_from call will fail."

Source: https://developers.stellar.org/docs/build/smart-contracts/example-contracts/tokens

---

## ✅ **VERIFICATION CHECKLIST**

When you test, verify:

- [ ] Clicking "Deposit" triggers TWO Freighter popups
- [ ] First popup says "approve" (XLM Token contract)
- [ ] Second popup says "deposit_liquidity" (LendingDemo contract)
- [ ] Both transactions succeed without errors
- [ ] Liquidity pool balance increases
- [ ] No "UnreachableCodeReached" errors
- [ ] Success message appears

---

**This is the CORRECT, SECURE, and STANDARD way to handle token deposits in Soroban!** 🎉
