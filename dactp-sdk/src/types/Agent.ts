/**
 * Agent-related types for DACTP Protocol
 */

export type AgentScope = 'borrow' | 'repay' | 'stake' | 'trade' | 'vote' | string;

export interface AgentInfo {
  owner: string;
  scopes: AgentScope[];
  maxAmount: number;
  revoked: boolean;
}

export interface RegisterAgentParams {
  owner: string;
  agent: string;
  scopes: AgentScope[];
  maxAmount: number;
}

export interface RevokeAgentParams {
  owner: string;
  agent: string;
}

export interface AuthorizationCheck {
  agent: string;
  action: AgentScope;
  amount: number;
}

export interface AuthorizationResult {
  authorized: boolean;
  reason?: string;
  maxAllowed?: number;
}