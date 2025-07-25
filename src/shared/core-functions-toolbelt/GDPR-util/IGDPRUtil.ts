import type { FilesReplaced, ReplacementFile, ReplacePredicate, ObjectStoreCredentials } from './types.js';
import type { Conversation } from '../conversation-util/types.js';

/**
 * GDPR related functionality
 */
export interface IGDPRUtil {
    /**
     * WARNING: This will remove all files of a permanently!
     * Ask you account manager for permissions.
     * @param conversation Conversation for which the files should be replaced.
     * @param credentials Credentials for the object store where files are stored.
     * @param shouldReplace Matcher function that can be used to filter files.
     * @param replacementFile File that is used to replace current files. By default a 1x1 black png.
     * @returns Promise of files that have been replaced.
     */
    replaceConversationFiles(
        conversation: Conversation,
        credentials: ObjectStoreCredentials,
        shouldReplace?: ReplacePredicate,
        replacementFile?: ReplacementFile,
    ): Promise<FilesReplaced>;
}
