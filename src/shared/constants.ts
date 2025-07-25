export const BUCKET_SIZES = {
  '5m': 300,
  '1h': 3600,
  '1d': 86400,
};

export const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
export const FIFTEEN_MINUTES = 15 * 60 * 1000;

export const DEFAULT_FORMAT_DATETIME_WITH_SECONDS = 'DD.MM.YYYY - HH:mm:ss z';

export const INVOCATION_STATE_LABELS = {
  UNKNOWN: 'Unknown Errors',
  SUCCEEDED: 'Successful Invocations',
  CODING_FAILURE: 'Code-based Errors',
  PLATFORM_FAILURE: 'Platform Failures',
  TIMEOUT: 'Timeout Errors',
};
