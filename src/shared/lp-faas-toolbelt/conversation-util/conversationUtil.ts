import { ILpClient, ILpClientOptions } from '../lp-client/LpClient';
import { LpServices } from '../lp-client/LpServices';
import { ConversationContentTypes } from './ConversationContentTypes';
import { IConversation } from './IConversation';
import { IConversationUtil } from './IConversationUtil';
import { IKeywordScannerResult } from './IKeywordScannerResult';

export class ConversationUtil implements IConversationUtil {
  private brandId: string | undefined = process.env.BRAND_ID;

  constructor(private lpClient: ILpClient) {}

  public async getConversationById(
    conversationId: string,
    contentToRetrieve?: (ConversationContentTypes | string)[],
  ): Promise<IConversation> {
    if (!conversationId) {
      throw new Error('Please provide a conversation ID.');
    }

    const requestBody = { conversationId, contentToRetrieve };

    if (!contentToRetrieve || contentToRetrieve.length === 0) {
      delete requestBody.contentToRetrieve;
    }

    try {
      const requestOptions: ILpClientOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: requestBody,
        json: true,
      };

      const conversation = await this.lpClient(
        LpServices.MSG_HIST,
        `/messaging_history/api/account/${this.brandId}/conversations/conversation/search?v=2`,
        requestOptions,
      );

      if (!conversation.conversationHistoryRecords.length) {
        throw new Error(`Conversation "${conversationId}" not found.`);
      }

      return conversation;
    } catch (error) {
      throw new Error(`Error while fetching conversation "${conversationId}": ${error.message}`);
    }
  }

  public scanConversationForKeywords(conversation: any, keywords: string[]): IKeywordScannerResult[] {
    if (!conversation) {
      throw new Error('Please provide conversation object.');
    }

    if (!keywords || keywords.length === 0) {
      throw new Error('Please provide array containing keywords.');
    }

    const {
      conversationHistoryRecords: [{ messageRecords: transcript }],
    } = conversation;

    const messagesWithKeywords = keywords
      .map((keyword) => this.getMessagesWithCertainKeyword(transcript, keyword))
      .reduce((acc, param) => acc.concat(param));

    return messagesWithKeywords;
  }

  /**
   * Returns messages from a transcript which contain the provided keyword and enriches it with additional information,
   * about when the message was sent, who it was sent by and because of which keyword it was selected.
   * @param transcript The message Transcript which should be scanned for the provided keyword.
   * @param keyword Keyword which the transcript will be scanned for.
   */
  private getMessagesWithCertainKeyword(transcript: any, keyword: string): IKeywordScannerResult[] {
    const messages = transcript
      .filter((messageObject) => ['HOSTED_FILE', 'TEXT_PLAIN'].includes(messageObject.type))
      .map((messageObject) => ({
        message: messageObject.type === 'TEXT_PLAIN' ? messageObject.messageData.msg.text : messageObject.messageData.file.caption,
        sentTimestamp: messageObject.timeL,
        sentBy: messageObject.sentBy,
      }));

    return messages
      .filter(({ message }) => this.messageContainsKeyword(message, keyword))
      .map((messageObject) => ({ ...messageObject, tag: `keywordRef:${keyword}` }));
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
