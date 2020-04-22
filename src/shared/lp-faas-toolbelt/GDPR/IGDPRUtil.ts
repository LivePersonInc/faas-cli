import { FilesReplaced, IReplacementFile, IShouldReplace } from './IFileReplacer';

export interface IObjectStoreCredentials {
    username: string;
    password: string;
}

/**
 * GDPR related functionality
 */
export interface IGDPRUtil {
    /**
     * WARNING: This will remove all files of a permanently!
     * Ask you account manager for permissions.
     * @param conversation Conversation for which the files should be replaced.
     * @param credentials Credentials for the object store where files are stored.
     * @param shouldReplace Matcher function that can be used to filter fiiles.
     * @param replacementFile File that is used to replace current files. By default a 1x1 black png.
     * @returns Promise of files that have been replaced.
     */
    replaceConversationFiles(
        conversation: any,
        credentials: IObjectStoreCredentials,
        shouldReplace?: IShouldReplace,
        replacementFile?: IReplacementFile,
    ): Promise<FilesReplaced>;
}
