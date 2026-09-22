import { PublicClientApplication } from '@azure/msal-browser';
import { msalConfig } from './auth/authConfig';

export const msalInstance = new PublicClientApplication(msalConfig);

export async function initMsal() {
  await msalInstance.initialize();
  await msalInstance.handleRedirectPromise();
}
