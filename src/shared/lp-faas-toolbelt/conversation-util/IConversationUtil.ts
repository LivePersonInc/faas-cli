import { ConversationContentTypes } from './ConversationContentTypes';
import { IConversation } from './IConversation';
import { IKeywordScannerResult } from './IKeywordScannerResult';

export interface IConversationUtil {
    /**
     * Will retrieve a conversation Object from the Live-Engage Messaging Interaction API
     * @param conversationId ID of the conversation which should be retrieved
     * @param contentToRetrieve Array which can be used to define which contents of the conversation should be retrieved.
     * Use 'const { ConversationContentTypes } = require("lp-faas-toolbelt");' to get an overview of possible options.
     */
    getConversationById(conversationId: string, contentToRetrieve?: Array<ConversationContentTypes | string>): Promise<IConversation>;

    /**
     * Will scan a conversation Object for messages containing the provided keywords and collect them. Also it enriches them with additional information,
     * about when the message was sent, who it was sent by and because of which keyword it was selected.
     * @param conversation Conversation Object that has been retrieved with .getConversationById(conversationId).
     * @param keywords Array of keywords which the conversation will be scanned for.
     */
    scanConversationForKeywords(conversation: any, keywords: string[]): IKeywordScannerResult[];
}
