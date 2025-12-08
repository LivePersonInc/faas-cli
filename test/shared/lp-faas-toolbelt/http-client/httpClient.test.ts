import { writeFileSync, ensureDirSync, removeSync } from 'fs-extra';
import { join } from 'path';
import * as HTTP from 'dropin-request';
import {
  HttpClient,
  httpClient,
} from '../../../../src/shared/lp-faas-toolbelt/http-client/httpClient';

jest.mock('dropin-request', () =>
  jest.fn(() =>
    Promise.resolve({
      statusCode: 200,
    }),
  ),
);

describe('faas toolbelt - http client', () => {
  afterEach(() => {
    (HTTP as jest.Mock).mockClear();
  });
  it('should return a response with 403 because the url is not whitelisted', async () => {
    const fs = {
      readFileSync: jest.fn(
        () => `{
          "whitelist": []
        }`,
      ),
    };

    const client = new HttpClient({ fs });

    const response: any = await client.request('www.liveperson.com', {
      method: 'GET',
      headers: {},
      simple: false,
      resolveWithFullResponse: true,
    });

    expect(response.statusCode).toBe(403);
    expect(HTTP).not.toHaveBeenCalled();
  });

  it('should return a response with result because url is whitelisted (base-url)', async () => {
    const fs = {
      readFileSync: jest.fn(
        () => `{
          "whitelist": ["*.liveperson.com"]
        }`,
      ),
    };

    const client = new HttpClient({ fs });

    const response: any = await client.request('https://www.liveperson.com', {
      method: 'GET',
      headers: {},
      simple: true,
      resolveWithFullResponse: true,
      json: true,
    });

    expect(response.statusCode).toBe(200);
    expect(HTTP).toHaveBeenCalled();
  });

  it('should return a response with response called with object', async () => {
    const fs = {
      readFileSync: jest.fn(
        () => `{
          "whitelist": ["*.liveperson.com"]
        }`,
      ),
    };

    const client = new HttpClient({ fs });

    const response: any = await client.request({
      url: 'https://www.liveperson.com',
      method: 'GET',
      headers: {},
      simple: true,
      resolveWithFullResponse: true,
      json: true,
    });

    expect(response.statusCode).toBe(200);
    expect(HTTP).toHaveBeenCalled();
  });

  it('should return a response with result because url is whitelisted (complete uri)', async () => {
    const fs = {
      readFileSync: jest.fn(
        () => `{
          "whitelist": ["www.liveperson.com"]
        }`,
      ),
    };
    const client = new HttpClient({ fs });

    const response: any = await client.request({
      uri: 'https://www.liveperson.com',
      method: 'GET',
      headers: {},
      simple: true,
      resolveWithFullResponse: true,
      json: true,
    });

    expect(response.statusCode).toBe(200);
    expect(HTTP).toHaveBeenCalled();
  });

  it('should throw an error if settings.json is not set up or deleted', async () => {
    const fs = {
      readFileSync: jest.fn(),
    };

    const client = new HttpClient({ fs });

    try {
      await client.request('https://www.liveperson.com', {
        method: 'GET',
        headers: {},
        simple: true,
        resolveWithFullResponse: true,
        json: true,
      });
    } catch (error) {
      expect(error.message).toBe(
        'Please make sure you have set up a settings.json',
      );
    }
    expect(HTTP).not.toHaveBeenCalled();
  });

  it('should return a response if its called by the exported const', async () => {
    jest.spyOn(process, 'cwd').mockReturnValue(__dirname);
    ensureDirSync(join(__dirname, 'functions'));
    writeFileSync(
      join(__dirname, 'functions', 'settings.json'),
      JSON.stringify({
        whitelist: ['*.liveperson.com'],
      }),
    );

    const response = await httpClient({
      uri: 'https://www.liveperson.com',
      method: 'GET',
      headers: {},
      simple: true,
      resolveWithFullResponse: true,
      json: true,
    });

    expect(response.statusCode).toBe(200);
    expect(HTTP).toHaveBeenCalled();
    removeSync(join(__dirname, 'functions'));
  });
});
