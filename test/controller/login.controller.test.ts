import * as os from 'os';
import * as fs from 'fs-extra';
import { join } from 'path';
import { LoginController } from '../../src/controller/login.controller';
import { LoginService } from '../../src/service/login.service';
import { LoginView } from '../../src/view/login.view';
import { FileService } from '../../src/service/file.service';

describe('login controller', () => {
  jest.spyOn(os, 'tmpdir').mockReturnValue(__dirname);
  jest.spyOn(global.console, 'log').mockImplementation();
  const fileService = new FileService();

  it('should run the default login command', () => {
    const loginController = new LoginController();
    expect(loginController).toHaveProperty('loginService');
    expect(loginController).toHaveProperty('loginView');
  });

  it('should get the token and userId if token is valid', async () => {
    await fileService.writeTempFile({
      '123456789': {
        token: 'aöskldfj02ajösldkfjalsdkf',
        userId: 'TestUserId',
        username: 'testUser',
        active: true,
        csrf: 'öalskdjföalksdfjalskdf',
        sessionId: 'ölkjasdf',
      },
    });

    const loginService = new LoginService();
    loginService.isTokenValid = jest.fn(async () => true);
    const loginView = new LoginView();
    loginView.chooseOrEnterAccountId = jest.fn(() => '123456789') as any;

    const loginController = new LoginController({ loginService, loginView });

    const result = await loginController.getLoginInformation();

    expect(result).toEqual({
      accountId: '123456789',
      token: 'aöskldfj02ajösldkfjalsdkf',
      userId: 'TestUserId',
      username: 'testUser',
    });
  });

  it('should get the token and userId if token is not valid anymore', async () => {
    const loginService = new LoginService();
    loginService.isTokenValid = jest.fn(async () => false);

    const loginView = new LoginView();
    loginView.askForUsernameAndPassword = jest.fn(async () => ({
      username: 'testUser',
      password: 'testPW',
    })) as any;
    loginView.chooseOrEnterAccountId = jest.fn(() => '123456789') as any;

    const loginController = new LoginController({ loginService, loginView });

    const result = await loginController.getLoginInformation();

    expect(result).toEqual({
      accountId: '123456789',
      token: 'aöskldfj02ajösldkfjalsdkf',
      userId: 'TestUserId',
      username: 'testUser',
    });
  });

  it('should return a false if an error occurs during the check if a user is logged in', async () => {
    const loginView = new LoginView();
    const newFileService = new FileService();

    const loginService = new LoginService();
    loginService.isTokenValid = jest.fn(async () => false);
    newFileService.getTempFile = jest.fn(async () => {
      throw new Error('Cannot read from disk');
    });

    const loginController = new LoginController({
      loginService,
      loginView,
      fileService: newFileService,
    });

    const result = await loginController.isUserLoggedIn();

    expect(result).toBeFalsy();
  });

  it('should check tempfile if no sso login is availble when doing an is logged in check', async () => {
    await fileService.writeTempFile({
      '123456789': {
        token: 'aöskldfj02ajösldkfjalsdkf',
        userId: 'TestUserId',
        username: 'testUser',
        active: true,
        csrf: 'öalskdjföalksdfjalskdf',
        sessionId: 'ölkjasdf',
      },
    });

    const loginService = new LoginService();
    loginService.isTokenValid = jest.fn(async () => true);

    const loginController = new LoginController({ loginService });

    const result = await loginController.isUserLoggedIn();

    expect(result).toBeTruthy();
  });

  afterAll(() => {
    fs.removeSync(join(__dirname, 'faas-tmp.json'));
  });
});
