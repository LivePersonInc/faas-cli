import type { ILpClient, ILpClientOptions } from '../lp-client/types.js';
import type { ConversationContentTypes, Conversation, KeywordScannerResult, MessageRecord } from './types.js';
import type { IConversationUtil } from './IConversationUtil.js';

import { ErrorCodes } from '../errors/errorCodes.js';
import { makeSpecificError } from '../errors/toolbeltError.js';
import { isConversation, isError, isFetchTypeError, isToolbeltError } from '../shared/typesPredicates.js';
import { WellKnownLPServices } from '../lp-client/lpServices.js';
import { getTraceId } from '../shared/helper.js';

const newConversationUtilError = makeSpecificError('Conversation-Util');

export class ConversationUtil implements IConversationUtil {
    constructor(
        private lpClient: ILpClient,
        private accountId = process.env.X_LIVEPERSON_BRAND_ID,
    ) {}

    public async getConversationById(conversationId: string, contentToRetrieve?: ConversationContentTypes[]): Promise<Conversation> {
        if (!conversationId) {
            throw newConversationUtilError(ErrorCodes.ConversationUtil.General, 'Please provide a conversation ID.');
        }

        const requestBody = { conversationId, contentToRetrieve };

        if (!contentToRetrieve || contentToRetrieve.length === 0) {
            delete requestBody.contentToRetrieve;
        }

        try {
            const fetchOption: ILpClientOptions = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Request-Id': getTraceId(),
                },
                body: JSON.stringify(requestBody),
            };

            const response = await this.lpClient(
                WellKnownLPServices.MSG_HIST,
                `/messaging_history/api/account/${this.accountId}/conversations/conversation/search?v=2&company=lp&source=FaaS_Toolbelt`,
                fetchOption,
            );

            const conversation = (await response.json()) as unknown;

            if (!isConversation(conversation)) {
                const responseText = JSON.stringify(conversation);
                throw newConversationUtilError(ErrorCodes.ConversationUtil.UnexpectedResponse, `Unexpected response: ${responseText}. Status Code: ${response.status}`);
            }

            if (!conversation.conversationHistoryRecords.length) {
                throw newConversationUtilError(ErrorCodes.ConversationUtil.NotFound, `Conversation "${conversationId}" not found.`);
            }

            return conversation;
        } catch (error) {
            if (isToolbeltError(error)) {
                throw error;
            }

            if (isFetchTypeError(error)) {
                throw newConversationUtilError(ErrorCodes.ConversationUtil.General, `${error.message}. Cause: ${error?.cause?.message}`);
            }

            throw newConversationUtilError(
                ErrorCodes.ConversationUtil.General,
                `Error while fetching conversation "${conversationId}": ${isError(error) ? ` ${error.name}: ${error.message}` : 'unknown'}`,
            );
        }
    }
    scanConversationForKeywords(conversation: Conversation, keywords: string[]): KeywordScannerResult[] {
        if (!conversation || conversation.conversationHistoryRecords.length === 0 || !conversation.conversationHistoryRecords[0].messageRecords) {
            throw newConversationUtilError(ErrorCodes.ConversationUtil.General, 'Please provide conversation object with message records.');
        }

        if (!keywords || keywords.length === 0) {
            throw newConversationUtilError(ErrorCodes.ConversationUtil.General, 'Please provide array containing keywords.');
        }

        const {
            conversationHistoryRecords: [{ messageRecords: transcript }],
        } = conversation;

        const messagesWithKeywords = keywords.map((keyword) => this.getMessagesWithCertainKeyword(transcript, keyword)).reduce((acc, param) => acc.concat(param));

        return messagesWithKeywords;
    }

    /**
     * Returns messages from a transcript which contain the provided keyword and enriches it with additional information,
     * about when the message was sent, who it was sent by and because of which keyword it was selected.
     * @param transcript The message Transcript which should be scanned for the provided keyword.
     * @param keyword Keyword which the transcript will be scanned for.
     */
    private getMessagesWithCertainKeyword(transcript: MessageRecord[], keyword: string): KeywordScannerResult[] {
        const messages = transcript
            .filter((messageObject) => ['HOSTED_FILE', 'TEXT_PLAIN'].includes(messageObject.type))
            .map((messageObject) => ({
                message: messageObject.type === 'TEXT_PLAIN' ? messageObject.messageData.msg?.text || '' : messageObject.messageData.file?.caption || '',
                sentTimestamp: messageObject.timeL,
                sentBy: messageObject.sentBy,
            }));

        return messages.filter(({ message }) => this.messageContainsKeyword(message, keyword)).map((messageObject) => ({ ...messageObject, tag: `keywordRef:${keyword}` }));
    }

    /**
     * Checks if a message contains a keyword via RegEx-matching, returns an array containing the results of that search.
     * @param message Message which should be checked for keywords.
     * @param keyword Keyword which the message will be checked for.
     */
    private messageContainsKeyword(message: string, keyword: string): RegExpMatchArray | null {
        return message.match(new RegExp(keyword, 'gmi'));
    }
}
