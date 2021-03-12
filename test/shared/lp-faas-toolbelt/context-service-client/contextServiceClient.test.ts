import { Toolbelt } from '../../../../src/shared/lp-faas-toolbelt/index';

describe('Context Service Client', () => {
  it('should throw an error if the env variable CONTEXT_SERVICE_ENVIRONMENT is not set correctly', async () => {
    expect(() => {
      Toolbelt.ContextServiceClient({
        apiKey: 'öalskfjöalsdf',
        accountId: '123456789',
      });
    }).toThrowError('Could not determine ContextService environment');
  });

  it('should create the context service client if the env variable CONTEXT_SERVICE_ENVIRONMENT is set correctly (QA)', () => {
    // eslint-disable-next-line dot-notation
    process.env['CONTEXT_SERVICE_ENVIRONMENT'] = 'qa';
    const serviceClient = Toolbelt.ContextServiceClient({
      apiKey: 'asdöflaksdfjöas',
      accountId: '123456789',
    }) as any;
    expect(serviceClient).toBeDefined();
    expect(serviceClient.baseUrl).toEqual('lp-mavencontext-qa.dev.lprnd.net');
  });

  it('should create the context service client if the env variable CONTEXT_SERVICE_ENVIRONMENT is set correctly (Z1-A)', () => {
    // eslint-disable-next-line dot-notation
    process.env['CONTEXT_SERVICE_ENVIRONMENT'] = 'z1-a';
    const serviceClient = Toolbelt.ContextServiceClient({
      apiKey: 'asdöflaksdfjöas',
      accountId: '123456789',
    }) as any;
    expect(serviceClient).toBeDefined();
    expect(serviceClient.baseUrl).toEqual('va-a.context.liveperson.net');
  });

  it('should create the context service client if the env variable CONTEXT_SERVICE_ENVIRONMENT is set correctly (Z1)', () => {
    // eslint-disable-next-line dot-notation
    process.env['CONTEXT_SERVICE_ENVIRONMENT'] = 'z1';
    const serviceClient = Toolbelt.ContextServiceClient({
      apiKey: 'asdöflaksdfjöas',
      accountId: '123456789',
    }) as any;
    expect(serviceClient).toBeDefined();
    expect(serviceClient.baseUrl).toEqual('z1.context.liveperson.net');
  });

  it('should create the context service client if the env variable CONTEXT_SERVICE_ENVIRONMENT is set correctly (Z2)', () => {
    // eslint-disable-next-line dot-notation
    process.env['CONTEXT_SERVICE_ENVIRONMENT'] = 'z2';
    const serviceClient = Toolbelt.ContextServiceClient({
      apiKey: 'asdöflaksdfjöas',
      accountId: '123456789',
    }) as any;
    expect(serviceClient).toBeDefined();
    expect(serviceClient.baseUrl).toEqual('z2.context.liveperson.net');
  });

  it('should create the context service client if the env variable CONTEXT_SERVICE_ENVIRONMENT is set correctly (Z3)', () => {
    // eslint-disable-next-line dot-notation
    process.env['CONTEXT_SERVICE_ENVIRONMENT'] = 'z3';
    const serviceClient = Toolbelt.ContextServiceClient({
      apiKey: 'asdöflaksdfjöas',
      accountId: '123456789',
    }) as any;
    expect(serviceClient).toBeDefined();
    expect(serviceClient.baseUrl).toEqual('z3.context.liveperson.net');
  });
});
