/**
 * Agent Manager - Handles agent registration, authorization, and management
 */
import { StellarClient } from '../utils/stellar';
import { AgentInfo, RegisterAgentParams, RevokeAgentParams, AuthorizationCheck, AuthorizationResult } from '../types/Agent';
import { TxResult, TxOptions } from '../types/Common';
export declare class AgentManager {
    private stellar;
    constructor(stellar: StellarClient);
    /**
     * Register a new agent with specific permissions and limits
     */
    register(params: RegisterAgentParams, options?: TxOptions): Promise<TxResult>;
    /**
     * Revoke an agent permanently
     */
    revoke(params: RevokeAgentParams, options?: TxOptions): Promise<TxResult>;
    /**
     * Check if an agent is authorized to perform an action with a specific amount
     */
    isAuthorized(check: AuthorizationCheck): Promise<AuthorizationResult>;
    /**
     * Get agent information
     */
    getInfo(agentAddress: string): Promise<AgentInfo | null>;
    /**
     * Check if an agent exists
     */
    exists(agentAddress: string): Promise<boolean>;
}
//# sourceMappingURL=AgentManager.d.ts.map