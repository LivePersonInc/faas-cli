export interface ISecretEntry {
    /**
     * Key of the secret made of chars that match [A-z0-9-_] and limited to 100 chars,
     */
    key: string;
    /**
     * Value of the secret which is limited to 10000 chars.
     */
    value: any;
}
