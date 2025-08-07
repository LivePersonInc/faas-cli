export {};

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace NodeJS {
        interface ProcessEnv {
            X_LIVEPERSON_PROJECT_ID: string; // Customer Project ID
            X_LIVEPERSON_BRAND_ID: string;
            X_LIVEPERSON_FUNCTION_UUID: string;
            X_LIVEPERSON_CSDS_DOMAIN: string;
        }
    }
}
