export const errorMessages = {
  'com.liveperson.faas.ui.payload-too-large': {
    title: 'Payload Too Large',
    text: 'Payload is too large for provided function',
  },
  'com.liveperson.faas.fm.validation.general': {
    title: 'Validation error',
    text: 'Provided function did not pass validation',
  },
  'com.liveperson.faas.fm.validation.invalid-syntax': {
    title: 'Validation error',
    text: 'Invalid Syntax',
  },
  'com.liveperson.faas.fm.validation.invalid-domain': {
    title: 'Invalid domain',
    text:
      'The domain you entered is not a valid domain. Please use something like this "example.com"',
  },
  'com.liveperson.faas.provision.defaultappkey.max-number-of-keys-reached': {
    title: 'Maximum Key Reached',
    text:
      'Maximum number of app-keys reached. Please inform your account manager.',
    errorMsg: 'Could not create default App Key: Max Number of keys reached.',
  },
  'com.liveperson.faas.fm.validation.contract-error': {
    title: 'Validation error',
    text:
      'Function violates <a rel="noopener noreferrer" target="_blank" href="https://developers.liveperson.com/liveperson-functions-getting-started.html#step-4-develop-your-function">Lambda contract</a>: Missing "function lambda(input, callback)	&#123; &hellip; callback(&lsaquo;error&rsaquo;, &lsaquo;output&rsaquo;)	&#125;".',
  },
  'com.liveperson.faas.fm.validation.unallowed-dependency': {
    title: 'Validation error',
    text:
      'You can only use the dependencies that you enabled in the settings tab',
  },
  'com.liveperson.faas.fm.validation.to-long': {
    title: 'Validation error',
    text: 'Source code exceeded the maximum length of 100,000 characters',
  },
  'com.liveperson.faas.dm.general': {
    title: 'Deployment error',
    text: 'There was an unexpected error during the deployment process',
  },
  'com.liveperson.faas.dm.action.not-allowed': {
    title: 'Deployment error',
    text: 'Not allowed to deploy a lambda',
  },
  'com.liveperson.faas.dm.build.general': {
    title: 'Deployment error',
    text: 'The docker build process has caused an unknown error',
  },
  'com.liveperson.faas.dm.build.rejected': {
    title: 'Deployment error',
    text: 'The docker build process of your function was rejected',
  },
  'com.liveperson.faas.dm.push.general': {
    title: 'Deployment error',
    text: 'Pushing the docker image to Harbor caused an unknown error',
  },
  'com.liveperson.faas.dm.push.invalid-credentials': {
    title: 'Deployment error',
    text: 'Pushing the docker image to Harbor was denied (invalid credentials)',
  },
  'com.liveperson.faas.dm.push.harbor-inaccessible': {
    title: 'Deployment error',
    text: 'We could not reach the Harbor repository to push the docker image',
  },
  'com.liveperson.faas.dm.push.rejected': {
    title: 'Deployment error',
    text: 'Pushing the docker image to Harbor repository was rejected',
  },
  'com.liveperson.faas.dm.deploy.general': {
    title: 'Deployment error',
    text: 'The deploy process to Open FaaS has caused an unknown error',
  },
  'com.liveperson.faas.dm.deploy.faas-inaccessible': {
    title: 'Deployment error',
    text: 'We could not reach Open FaaS to deploy your function',
  },
  'com.liveperson.faas.db.general': {
    title: 'An unknown error has occurred',
    text: 'The database has caused an unknown error',
  },
  'com.liveperson.faas.db.error.revision': {
    title: 'Newer version available',
    text:
      'There is a newer version of your dataset available. Please refresh the site and try again',
  },
  'com.liveperson.faas.db.error.authorization': {
    title: 'Authorization failed',
    text:
      'The authorization to the database failed. Please refresh the site and try again',
  },
  'com.liveperson.faas.db.conflict': {
    title: 'Operation conflict',
    text:
      'Operation conflicted with an operation of another user. Please refresh the site and try again',
  },
  'com.liveperson.faas.db.not-found': {
    title: 'Dataset not found',
    text:
      'The requested dataset has not been found in the database or was deleted. Redirecting to the previous page...',
  },
  'com.liveperson.faas.ui.general': {
    title: 'An unknown error has occurred',
    text: 'This  has caused an unknown error: {errorCode}',
  },
  'com.liveperson.faas.ui.api.network-error': {
    title: 'No network',
    text:
      'We were not able to reach the LivePerson servers. Make sure your network connection is stable and try refreshing the site.',
  },
  'com.liveperson.faas.fm.validation.unallowed-code': {
    title: 'Unallowed code',
    text:
      'Your code contains expressions currently not allowed on the Functions platform (e.g. eval())',
  },
  'com.liveperson.faas.ui.api.invalid-json': {
    title: 'An unknown error has occurred',
    text:
      'The communication with another service has caused an unknown error (Invalid JSON response). Please refresh the site and try again',
  },
  'com.liveperson.faas.ui.api.bad-request': {
    title: 'An unknown error has occurred',
    text:
      'The communication with another service has caused an unknown error (Bad Request). Please refresh the site and try again',
  },
  'com.liveperson.faas.ui.api.unauthorized': {
    title: 'Authorization failed',
    text:
      'The authorization between this service and other services failed. Please try to re-login',
  },
  'com.liveperson.faas.ui.api.invocation-timeout': {
    title: 'Invocation failed',
    text: 'The function took too long to respond',
  },
};
