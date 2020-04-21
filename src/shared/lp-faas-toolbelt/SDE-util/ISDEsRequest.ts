import { SDETypes } from './SDETypes';

interface ISDE {
    type: SDETypes | string;
    [key: string]: any;
}

export interface ISDEsRequest extends Array<ISDE> {}
