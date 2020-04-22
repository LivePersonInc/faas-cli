import { IReplacementFile } from './IFileReplacer';

const oneByOneBlackImage = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

export const defaultReplacementFile: IReplacementFile = {
    body: Buffer.from(oneByOneBlackImage, 'base64'),
    contentType: 'image/png',
};
