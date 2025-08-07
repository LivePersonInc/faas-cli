import type { SecretEntry, SecretRequestOptions } from './types.js';

/**
 * Client that will handle the communication with the Secret Storage.
 */
export interface ISecretClient {
  /**
   * Searches the Secret that belong to the provided key.
   * Will raise an SecretError if there is no secret for the provided key.
   * @param key Name of the Secret
   * @param options Optional settings for timeout and cache useage
   * @returns Secret in Key-Value Format
   */
  readSecret(
    key: string,
    options?: Partial<SecretRequestOptions>,
  ): Promise<SecretEntry>;
  /**
   * Updates the Secret with the provided update-entry.
   * Will raise an SecretError if there is no secret with the specified key.
   * @param updatedSecret Secret in Key-Value Format
   * @param options Optional settings for timeout and cache useage
   * @returns Updated Version of the Secret in Key-Value Format
   */
  updateSecret(
    updatedSecret: SecretEntry,
    options?: Partial<SecretRequestOptions>,
  ): Promise<SecretEntry>;
}
