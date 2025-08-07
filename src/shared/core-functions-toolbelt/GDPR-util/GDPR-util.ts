import type { Conversation, MessageRecord } from '../conversation-util/types.js';
import type { ICsdsClient } from '../csds-client/ICsdsClient.js';
import type { IGDPRUtil } from './IGDPRUtil.js';
import type { ObjectStoreCredentials, ReplacePredicate, ReplacementFile, FilesReplaced } from './types.js';

import { makeSpecificError } from '../errors/toolbeltError.js';
import { ErrorCodes } from '../errors/errorCodes.js';
import { isError, isFetchTypeError, isToolbeltError } from '../shared/typesPredicates.js';
import { defaultReplacementFile } from './defaultReplacementFile.js';
import { getTraceId } from '../shared/helper.js';

const newGDPRUtilError = makeSpecificError('GDPR-Util');

export class GDPRUtil implements IGDPRUtil {
    constructor(
        private csdsClient: ICsdsClient,
        private httpClient = fetch,
    ) {}

    public async replaceConversationFiles(
        conversation: Conversation,
        credentials: ObjectStoreCredentials,
        shouldReplace: ReplacePredicate = () => true,
        replacementFile: ReplacementFile = defaultReplacementFile,
    ): Promise<FilesReplaced> {
        try {
            if (!conversation.conversationHistoryRecords || conversation.conversationHistoryRecords.length === 0) {
                return [];
            }

            const {
                conversationHistoryRecords: [{ messageRecords: transcript }],
            } = conversation;

            if (!transcript || transcript.length === 0) {
                throw newGDPRUtilError(ErrorCodes.GDPRUtil.General, `No message records provided`);
            }
            const paths = this.getFilePaths(transcript, shouldReplace);

            if (paths.length === 0) {
                return paths;
            }

            const host = await this.csdsClient.get('swift');
            const token = await this.authenticate(host, credentials);

            await Promise.all(paths.map((path) => this.replaceFile(path, host, token, replacementFile)));

            return paths;
        } catch (error) {
            if (isToolbeltError(error)) {
                throw error;
            }

            throw newGDPRUtilError(ErrorCodes.GDPRUtil.General, isError(error) ? `${error.name}: ${error.message}` : 'unknown');
        }
    }

    private getFilePaths(transcript: MessageRecord[], shouldReplace: ReplacePredicate): FilesReplaced {
        return transcript
            .filter((m) => m.type === 'HOSTED_FILE')
            .map((m) => m.messageData?.file?.relativePath || 'unknown')
            .filter((path) => path !== 'unknown')
            .filter(shouldReplace);
    }

    private async authenticate(host: string, credentials: ObjectStoreCredentials): Promise<string> {
        try {
            const response = await this.httpClient(`https://${host}/auth/v1.0`, {
                method: 'GET',
                headers: {
                    'X-Auth-User': credentials.username,
                    'X-Auth-Key': credentials.password,
                },
            });

            if (!response.ok) {
                const responseText = await response.text();
                throw newGDPRUtilError(ErrorCodes.GDPRUtil.AuthFailure, `Authentication failed with response: ${responseText}. Status Code: ${response.status}`);
            }

            const token = response.headers.get('x-auth-token');

            if (!token) {
                throw newGDPRUtilError(ErrorCodes.GDPRUtil.AuthFailure, `No Auth token returned`);
            }

            return token;
        } catch (error) {
            if (isToolbeltError(error)) {
                throw error;
            }
            if (isFetchTypeError(error)) {
                throw newGDPRUtilError(ErrorCodes.GDPRUtil.AuthFailure, `Authentication failed: ${error.message}. Cause: ${error?.cause?.message}`);
            }

            throw newGDPRUtilError(ErrorCodes.GDPRUtil.AuthFailure, isError(error) ? `Authentication Failed: ${error.name}: ${error.message}` : 'unknown');
        }
    }

    private async replaceFile(path: string, host: string, token: string, replacementFile: ReplacementFile): Promise<void> {
        try {
            const response = await this.httpClient(`https://${host}${path}`, {
                method: 'PUT',
                headers: {
                    'content-type': replacementFile.contentType,
                    'x-auth-token': token,
                    'X-Request-Id': getTraceId(),
                },
                body: replacementFile.body,
            });

            if (!response.ok) {
                const responseText = await response.text();
                throw newGDPRUtilError(ErrorCodes.GDPRUtil.General, `File replacement failed with response: ${responseText}. Status Code: ${response.status}`);
            }
        } catch (error) {
            if (isToolbeltError(error)) {
                throw error;
            }
            if (isFetchTypeError(error)) {
                throw newGDPRUtilError(ErrorCodes.GDPRUtil.ReplaceFileFailed, `${error.message}. Cause: ${error?.cause?.message}`);
            }

            throw newGDPRUtilError(ErrorCodes.GDPRUtil.ReplaceFileFailed, isError(error) ? `${error.name}: ${error.message}` : 'unknown');
        }
    }
}
