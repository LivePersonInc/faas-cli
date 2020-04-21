import { ICsdsClient } from '../csds-client/ICsdsClient';
import { defaultReplacementFile } from './defaultReplacementFile';
import { FilesReplaced, IReplacementFile, IShouldReplace } from './IFileReplacer';
import { IGDPRUtil, IObjectStoreCredentials } from './IGDPRUtil';
import { SwiftAuth } from './SwiftAuth';
import { SwiftFileReplacer } from './SwiftFileReplacer';

export class GDPRUtil implements IGDPRUtil {
    constructor(private csdsClient: ICsdsClient) {}

    public async replaceConversationFiles(
        conversation: any,
        { username, password }: IObjectStoreCredentials,
        shouldReplace: IShouldReplace = () => true,
        replacementFile: IReplacementFile = defaultReplacementFile,
    ): Promise<FilesReplaced> {
        const authStrategy = new SwiftAuth(username, password);
        const fileReplacer = new SwiftFileReplacer(
            replacementFile,
            {
                authStrategy,
                shouldReplace,
            },
            this.csdsClient,
        );

        return await fileReplacer.replaceFiles(conversation);
    }
}
