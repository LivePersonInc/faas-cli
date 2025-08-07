export type OAuth2ClientCreds = {
    client_id: string;
    client_secret: string;
};

export type AuthServerResponse = {
    access_token: string;
    token_type: string;
    expires_in: string;
};

export type AccessTokenData = AuthServerResponse & { requestedAt: Date };
