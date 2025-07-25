export type FilesReplaced = string[];

/**
 * Defines the strategy how the file replace has to authorize
 */
export type FileReplacerAuth = {
    /**
     * @param host Host for which the headers should be retrieved
     */
    getAuthHeaders: (host: string) => Promise<unknown>;
};

export type ReplacePredicate = (path: string) => boolean;

export type FileReplacerConfig = {
    authStrategy: FileReplacerAuth;
    shouldReplace: ReplacePredicate;
};

export type ReplacementFile = {
    body: Buffer;
    contentType: string;
};

export interface IFileReplacer {
    replaceFiles(conversation: string): Promise<FilesReplaced>;
}
export type ObjectStoreCredentials = {
    username: string;
    password: string;
};
