import { ISecretEntry } from './IsecretEntry';

/**
 * Client that will handle the communication with the Secret Storage.
 */
export interface ISecretClient {
    /**
     * Searches the Secret that belong to the provided key.
     * Will raise an SecretError if there is no secret for the provided key.
     * @param key Name of the Secret
     * @returns Secret in Key-Value Format
     */
    readSecret(key: string): Promise<ISecretEntry>;
    /**
     * Updates the Secret with the provided update-entry.
     * Will raise an SecretError if there is no secret with the specified key.
     * @param updatedSecret Secret in Key-Value Format
     * @returns Updated Version of the Secret in Key-Value Format
     */
    updateSecret(updatedSecret: ISecretEntry): Promise<ISecretEntry>;
}
