import { Environment } from './const';

export function GenerateHeaders(): { 'LP-URL': string | undefined; 'User-Agent': string } {
    return {
        'LP-URL': process.env[Environment.General.Account],
        'User-Agent': `LP-Lambda-${process.env[Environment.General.Lambda]}`,
    };
}
