import { IConversation } from '../conversation-util/IConversation';
import { ILpClient, ILpClientOptions } from '../lp-client/LpClient';
import { LpServices } from '../lp-client/LpServices';
import { ISDEsResponse } from './ISDEResponse';
import { ISDEsRequest } from './ISDEsRequest';
import { ISDEUtil } from './ISDEUtil';

export class SDEUtil implements ISDEUtil {
    private brandId: string | undefined = process.env.BRAND_ID;

    constructor(private lpClient: ILpClient) {}

    public getSDEsFromConv(conversation: IConversation): { sdes: ISDEsResponse; unAuthSdes: ISDEsResponse } {
        try {
            if (!conversation || !conversation.hasOwnProperty('conversationHistoryRecords')) {
                throw new Error('Please provide a valid conversation.');
            }
            const {
                conversationHistoryRecords: [{ sdes = { events: [] }, unAuthSdes = { events: [] } }],
            } = conversation;

            return { sdes: this.sortSDEs(sdes), unAuthSdes: this.sortSDEs(unAuthSdes) };
        } catch (error) {
            throw new Error(`Error while getting SDEs from conversation: ${error.message}`);
        }
    }

    public async addSDEs(sdes: ISDEsRequest, visitorId: string, sessionId: string): Promise<void> {
        if (!sdes || sdes.length === 0) {
            throw new Error('Please provide one or more SDEs');
        }

        try {
            const requestOptions: ILpClientOptions = {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: sdes,
                json: true,
            };
            await this.lpClient(
                LpServices.SMT,
                `/api/account/${this.brandId}/monitoring/visitors/${visitorId}/visits/current/events?v=1&sid=${sessionId}`,
                requestOptions,
            );
        } catch (error) {
            throw new Error(`Error while setting SDEs: ${error.message}`);
        }
    }

    /**
     * Will sort the events of the SDES by the server-timestamp. The last event is the most recent one.
     * @param sdes the sdes which should be sorted.
     */
    private sortSDEs(sdes: ISDEsResponse): ISDEsResponse {
        return {
            events: sdes.events.sort((event1, event2) => (event1.serverTimeStamp < event2.serverTimeStamp ? -1 : 1)),
        };
    }
}
