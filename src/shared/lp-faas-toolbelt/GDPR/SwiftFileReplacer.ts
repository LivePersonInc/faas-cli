import { ICsdsClient } from '../csds-client/ICsdsClient';
import { httpClient } from '../http-client/httpClient';
import { FilesReplaced, IFileReplacer, IFileReplacerAuth, IFileReplacerConfig, IReplacementFile } from './IFileReplacer';

/**
 * Implementation a FileReplacer. Replaces files on Swift.
 */
export class SwiftFileReplacer implements IFileReplacer {
  private shouldReplace: any;
  private authStrategy: IFileReplacerAuth;
  constructor(
    private replacementFile: IReplacementFile,
    { shouldReplace, authStrategy }: IFileReplacerConfig,
    private csdsClient: ICsdsClient,
  ) {
    this.shouldReplace = shouldReplace;
    this.authStrategy = authStrategy;
  }
  public async replaceFiles(conversation: any): Promise<FilesReplaced> {
    if (!conversation) {
      throw new Error('Please provide conversation object.');
    }
    const { conversationHistoryRecords = [] } = conversation;

    const transcript = conversationHistoryRecords
      .map((record) => record.messageRecords)
      .reduce((acc, messages) => acc.concat(messages), []);

    const paths = this.getFilePaths(transcript);
    await Promise.all(paths.map(this.replaceFile, this));

    return paths;
  }

  private getFilePaths(transcript: any[]): FilesReplaced {
    return transcript
      .filter((m) => m.type === 'HOSTED_FILE')
      .map((m) => m.messageData.file.relativePath)
      .filter(this.shouldReplace);
  }
  private async replaceFile(path: string): Promise<void> {
    try {
      const host = await this.getHost();
      const authHeaders = await this.authStrategy.getAuthHeaders(host);

      await httpClient(`https://${host}${path}`, {
        method: 'PUT',
        simple: true,
        resolveWithFullResponse: false,
        headers: {
          'content-type': this.replacementFile.contentType,
          ...authHeaders,
        },
        body: this.replacementFile.body,
      });
    } catch (error) {
      throw new Error(`Unable to replace image ${path}: ${error.message}`);
    }
  }

  private getHost(): Promise<string> {
    return this.csdsClient.get('swift');
  }
}
