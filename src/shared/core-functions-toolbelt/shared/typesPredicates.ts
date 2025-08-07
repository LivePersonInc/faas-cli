import type { CsdsServiceResponse } from '../csds-client/types.js';
import type { OAuth2ClientCreds } from '../oauth2-client/types.js';

import { ToolBeltError } from '../errors/toolbeltError.js';
import { Conversation } from '../conversation-util/types.js';
import { OrchestratorError } from '../errors/orchestratorError.js';
import { SDEsResponse } from '../SDE-util/types.js';
import { V1CompatSecretObject } from '../secret-storage/types.js';

export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

export function isToolbeltError(error: unknown): error is ToolBeltError {
  if (isError(error)) {
    return (
      'component' in error &&
      'code' in error &&
      typeof (error as any).component === 'string' &&
      typeof (error as any).code === 'string'
    );
  }

  return false;
}

// Mostly required to check that  statusCode is inclueded, since is optional a
export function isOrchestratorErrorWithStatusCode(
  error: unknown,
): error is OrchestratorError {
  if (isToolbeltError(error)) {
    return (
      'statusCode' in error &&
      (error as any).statusCode !== undefined &&
      typeof (error as any).statusCode == 'number'
    );
  }

  return false;
}

export function isObject(obj: unknown): obj is Record<string, unknown> {
  return obj !== undefined && obj !== null && typeof obj === 'object';
}

export function isOAuth2ClientCreds(
  creds: unknown,
): creds is OAuth2ClientCreds {
  if (isObject(creds)) {
    return (
      'client_id' in creds &&
      typeof creds.client_id === 'string' &&
      'client_secret' in creds &&
      typeof creds.client_secret === 'string'
    );
  }

  return false;
}

export function isCsdsServiceResponse(
  response: unknown,
): response is CsdsServiceResponse {
  if (isObject(response)) {
    return 'baseURIs' in response && Array.isArray(response.baseURIs);
  }
  return false;
}

export function isBodyInit(value: unknown): value is BodyInit {
  return (
    value instanceof Blob ||
    value instanceof ArrayBuffer ||
    ArrayBuffer.isView(value) ||
    value instanceof FormData ||
    value instanceof URLSearchParams ||
    value instanceof ReadableStream ||
    typeof value === 'string'
  );
}

export type Cause = {
  code: string;
  message: string;
  stack: string;
};

// There is no proper type of Fetch errors, They are instance of TypeError + the "cause" object
export function isFetchTypeError(
  error: unknown,
): error is TypeError & { cause: Cause } {
  return (
    error instanceof TypeError &&
    'cause' in error &&
    error.cause != undefined &&
    typeof error.cause === 'object' &&
    'message' in error.cause &&
    (error as any).cause.message !== undefined &&
    typeof (error as any).cause.message == 'string' &&
    'code' in error.cause &&
    typeof (error as any).cause.code == 'string' &&
    'stack' in error.cause &&
    typeof (error as any).cause.stack == 'string'
  );
}

// See: https://developer.mozilla.org/en-US/docs/Web/API/DOMException#timeouterror
export function isDOMExceptionError(error: unknown): error is DOMException {
  return error instanceof DOMException;
}

export function isConversation(response: unknown): response is Conversation {
  if (isObject(response)) {
    return (
      '_metadata' in response &&
      isObject(response._metadata) &&
      'conversationHistoryRecords' in response &&
      Array.isArray(response.conversationHistoryRecords)
    );
  }
  return false;
}

export function isSDEsResponse(response: unknown): response is SDEsResponse {
  if (isObject(response)) {
    return (
      'events' in response &&
      isObject(response.events) &&
      Array.isArray(response.events)
    );
  }
  return false;
}

export function isGCPError(
  error: unknown,
): error is Error & { code: number; details: string; metadata: unknown } {
  if (error instanceof Error) {
    return (
      'code' in error &&
      typeof (error as any).code === 'number' &&
      'details' in error
    );
  }

  return false;
}

export function isV1CompatSecretObject(
  payload: unknown,
): payload is V1CompatSecretObject {
  if (isObject(payload)) {
    return (
      'LP_COMPAT_SECRET_TYPE' in payload &&
      typeof payload.LP_COMPAT_SECRET_TYPE === 'string' &&
      'secret' in payload
    );
  }
  return false;
}
