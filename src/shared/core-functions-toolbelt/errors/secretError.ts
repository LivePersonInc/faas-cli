import { ToolBeltError } from './toolbeltError.js';

/**
 * Secret Error is raised if there is an issue with getting a storing secrets
 */
export class SecretError extends ToolBeltError {
  constructor(
    public component: string,
    public code: string,
    public message: string,
    public originalBody?: string,
  ) {
    super(component, code, message);
  }
}

export function makeSpecificSecretError(
  component: 'SecretStore',
): (code: string, message: string, originalBody?: string) => ToolBeltError {
  return (code: string, message, originalBody) => {
    return new SecretError(component, code, message, originalBody);
  };
}
