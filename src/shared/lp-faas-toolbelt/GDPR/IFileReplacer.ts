export type FilesReplaced = string[];

/**
 * Defines the strategy how the file replace has to authorize
 */
export interface IFileReplacerAuth {
    /**
     * @param host Host for which the headers should be retrieved
     */
    getAuthHeaders: (host: string) => Promise<any>;
}

export type IShouldReplace = (path: string) => boolean;

export interface IFileReplacerConfig {
    authStrategy: IFileReplacerAuth;
    shouldReplace: IShouldReplace;
}

export interface IReplacementFile {
    body: Buffer;
    contentType: string;
}

export interface IFileReplacer {
    replaceFiles(conversation: any): Promise<FilesReplaced>;
}
