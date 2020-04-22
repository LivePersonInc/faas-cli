import { httpClient } from '../http-client/httpClient';
import { IFileReplacerAuth } from './IFileReplacer';

/**
 * Implementation of the swift auth strategy. Uses username and password.
 */
export class SwiftAuth implements IFileReplacerAuth {
    constructor(private username: string, private password: string) {}
    public async getAuthHeaders(host: string) {
        try {
            const {
                headers: { 'x-auth-token': token },
            } = await httpClient(`https://${host}/auth/v1.0`, {
                method: 'GET',
                simple: true,
                resolveWithFullResponse: true,
                headers: {
                    'X-Auth-User': this.username,
                    'X-Auth-Key': this.password,
                },
            });

            return { 'x-auth-token': token };
        } catch (error) {
            throw new Error(`Unable to authorize at Swift: ${error.message}`);
        }
    }
}
