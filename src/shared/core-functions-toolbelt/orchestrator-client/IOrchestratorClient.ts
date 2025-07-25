import type { OrchestratorInvocation, OrchestratorOptions, OrchestratorResponse } from './types';

export interface IOrchestratorClient {
    /**
     * @param invocations contains the UUIDs of the functions which will be invoked with their respective information
     * @param options Orchestrator invoke options: timeout, parallel invocation and error strategy
     * @param deadline gives the maximum time the orchestrator function is waiting for an answer (max 25s)
     * @throws  if "errorStrategy" option is "ExitOnError" and there is an invocation error, it will cancel other requests
     */
    invoke(invocations: OrchestratorInvocation[], deadline: number, options?: OrchestratorOptions): Promise<OrchestratorResponse[]>;
}
