import type { Conversation } from '../conversation-util/types.js';
import type { ConversationSDEs, SDE, SDEevent, SDEsResponse } from './types.js';
import type { ISDEUtil } from './ISDEUtil.js';
import type { ILpClient, ILpClientOptions } from '../lp-client/types.js';

import { makeSpecificError } from '../errors/toolbeltError.js';
import { ErrorCodes } from '../errors/errorCodes.js';
import { WellKnownLPServices } from '../lp-client/lpServices.js';
import { isError, isFetchTypeError, isSDEsResponse, isToolbeltError } from '../shared/typesPredicates.js';
import { getTraceId } from '../shared/helper.js';

const newSDEUtilError = makeSpecificError('SDE-Util');

/**
 * Will sort the events of the SDES by the server-timestamp. The last event is the most recent one.
 * @param sdes the sdes which should be sorted.
 */
const sortSDEs = (events: SDEevent[]): SDEsResponse => {
    return { events: events.sort((event1, event2) => (event1.serverTimeStamp < event2.serverTimeStamp ? -1 : 1)) };
};

export class SDEUtil implements ISDEUtil {
    constructor(
        private lpClient: ILpClient,
        private accountId = process.env.X_LIVEPERSON_BRAND_ID,
    ) {}
    public async addSDEs(sdes: SDE[], visitorId: string, sessionId: string): Promise<void> {
        if (sdes.length === 0) {
            throw newSDEUtilError(ErrorCodes.SDEsUtil.General, 'Please provide one or more SDEs');
        }

        try {
            const requestOptions: ILpClientOptions = {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Request-Id': getTraceId(),
                },
                body: JSON.stringify(sdes),
            };

            const response = await this.lpClient(
                WellKnownLPServices.SMT,
                `/api/account/${this.accountId}/monitoring/visitors/${visitorId}/visits/current/events?v=1&sid=${sessionId}`,
                requestOptions,
            );
            if (!response.ok) {
                const responseText = await response.text();
                throw newSDEUtilError(ErrorCodes.SDEsUtil.UnexpectedResponse, `Unexpected response: ${responseText}. Status Code: ${response.status}`);
            }
        } catch (error) {
            if (isToolbeltError(error)) {
                throw error;
            }

            if (isFetchTypeError(error)) {
                throw newSDEUtilError(ErrorCodes.SDEsUtil.General, `${error.message}. Cause: ${error?.cause?.message}`);
            }

            throw newSDEUtilError(ErrorCodes.SDEsUtil.General, isError(error) ? `${error.name}: ${error.message}` : 'unknown');
        }
    }
    public getSDEsFromConv(conversation: Conversation): ConversationSDEs {
        try {
            if (conversation.conversationHistoryRecords.length === 0) {
                throw newSDEUtilError(ErrorCodes.SDEsUtil.General, 'conversationHistoryRecords is empty');
            }

            const {
                conversationHistoryRecords: [{ sdes, unAuthSdes }],
            } = conversation;

            if (sdes === undefined && unAuthSdes == undefined) {
                throw newSDEUtilError(ErrorCodes.SDEsUtil.General, 'No sdes or unAuthSdes are provided');
            }

            return {
                sdes: sortSDEs(isSDEsResponse(sdes) ? sdes.events : []),
                unAuthSdes: sortSDEs(isSDEsResponse(unAuthSdes) ? unAuthSdes.events : []),
            };
        } catch (error) {
            if (isToolbeltError(error)) {
                throw error;
            }
            throw newSDEUtilError(ErrorCodes.SDEsUtil.General, isError(error) ? `Error while getting SDEs from conversation: ${error.name}: ${error.message}` : 'unknown');
        }
    }
}
