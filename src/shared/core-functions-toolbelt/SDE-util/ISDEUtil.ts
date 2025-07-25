import type { Conversation } from '../conversation-util/types.js';
import type { ConversationSDEs, SDE } from './types.js';

/**
 *  Interacts with Engagement Attributes API Docs: https://developers.liveperson.com/engagement-attributes-api-overview.html
 */
export interface ISDEUtil {
    /**
     * Will set or update SDEs to/of an Engagement via the Engagement Attributes API.
     * @param sdes Array with the SDEs that should be set/ updated. See Engagement Attributes API-Documentation
     * for more Information on how to structure it.
     * @param visitorId The ID of the visitor.
     * @param sessionId The ID of the session.
     */
    addSDEs(sdes: SDE[], visitorId: string, sessionId: string): Promise<void>;

    /**
     * Will extract all SDEs (authenticated and unauthenticated if existing) from a provided conversation and order
     * its events by the server-timestamp. The last event is the most recent one.
     * @param conversation the conversation of which the SDEs should be extracted.
     */
    getSDEsFromConv(conversation: Conversation): ConversationSDEs;
}
