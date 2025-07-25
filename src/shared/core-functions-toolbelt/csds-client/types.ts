export type ServiceDomainTuple = {
    service: string;
    baseURI: string;
};

export type CsdsServiceResponse = {
    baseURIs: (ServiceDomainTuple & { account: string })[];
};
