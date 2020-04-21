export interface ICsdsClient {
    get(service: string): Promise<string>;
}
