import { CsdsClient } from '../../src/service/csds.service';

const prodUris = {
  baseURIs: [
    {
      service: 'testservice1',
      account: '123456789',
      baseURI: 'testservice1.liveperson.net',
    },
    {
      service: 'testservice2',
      account: '123456789',
      baseURI: 'testservice2.liveperson.net',
    },
    {
      service: 'testservice3',
      account: '123456789',
      baseURI: 'testservice3.liveperson.net',
    },
  ],
};

describe('csds client', () => {
  it('should get the csds entry (prod)', async () => {
    const request = jest.fn(async () => prodUris) as any;

    const csdsClient = new CsdsClient(request);

    const entry = await csdsClient.getUri('123456789', 'testservice1');

    expect(entry).toBe('testservice1.liveperson.net');
  });

  it('should get the csds entry (le)', async () => {
    const request = jest.fn(async () => prodUris) as any;

    const csdsClient = new CsdsClient(request);

    const entry = await csdsClient.getUri('le123456789', 'testservice1');

    expect(entry).toBe('testservice1.liveperson.net');
  });

  it('should get the csds entry (qa)', async () => {
    const request = jest.fn(async () => prodUris) as any;

    const csdsClient = new CsdsClient(request);

    const entry = await csdsClient.getUri('qa123456789', 'testservice1');

    expect(entry).toBe('testservice1.liveperson.net');
  });

  it('should get the csds entry (fr)', async () => {
    const request = jest.fn(async () => prodUris) as any;

    const csdsClient = new CsdsClient(request);

    const entry = await csdsClient.getUri('fr123456789', 'testservice1');

    expect(entry).toBe('testservice1.liveperson.net');
  });

  it('should get the csds entry cache', async () => {
    const request = jest.fn(async () => prodUris) as any;

    const csdsClient = new CsdsClient(request);

    const entry = await csdsClient.getUri('fr123456789', 'testservice1');

    expect(entry).toBe('testservice1.liveperson.net');

    const entry2 = await csdsClient.getUri('fr123456789', 'testservice1');
    expect(entry2).toBe('testservice1.liveperson.net');
  }, 500);

  it("should throw an error if the csds entry couldn't be found", async () => {
    const request = jest.fn(async () => ({
      baseURIs: [],
    })) as any;

    const csdsClient = new CsdsClient(request);

    try {
      await csdsClient.getUri('fr123456789', 'testservice4');
    } catch (error) {
      expect(error.message).toBe('Service "testservice4" could not be found.');
    }
  });

  it('should throw an error if request went wrong', async () => {
    const request = jest.fn(async () => {
      throw new Error('Service not found');
    }) as any;

    const csdsClient = new CsdsClient(request);

    try {
      await csdsClient.getUri('fr123456789', 'testservice4');
    } catch (error) {
      expect(error.message).toBe('Service not found');
    }
  });

  it("should throw an error if it's an invalid accountId", async () => {
    const request = jest.fn(async () => ({
      baseURIs: [],
    })) as any;

    const csdsClient = new CsdsClient(request);

    try {
      await csdsClient.getUri('123123123', 'faasUI');
    } catch (error) {
      expect(error.message).toBe('Service "faasUI" could not be found.');
    }
  });
});
