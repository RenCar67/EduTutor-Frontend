import type { Configuration, RedirectRequest, SilentRequest } from '@azure/msal-browser';

const clientId = import.meta.env.VITE_AZURE_CLIENT_ID?.trim() ?? '';
const tenantId = import.meta.env.VITE_AZURE_TENANT_ID?.trim() ?? '';
const redirectUri = import.meta.env.VITE_AZURE_REDIRECT_URI?.trim() || window.location.origin;
const bffScope = import.meta.env.VITE_AZURE_BFF_SCOPE?.trim() ?? '';

export const azureConfigured = Boolean(clientId && tenantId);
export const bffApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() || '/api/v1';
export const azureScopes = ['openid', 'profile', 'email', 'User.Read', ...(bffScope ? [bffScope] : [])];
export const tokenScopes = bffScope ? [bffScope] : ['User.Read'];

export const msalConfig: Configuration = {
  auth: {
    clientId: clientId || '00000000-0000-0000-0000-000000000000',
    authority: `https://login.microsoftonline.com/${tenantId || 'common'}`,
    redirectUri,
    postLogoutRedirectUri: redirectUri,
  },
  cache: {
    cacheLocation: 'sessionStorage',
  },
};

export const loginRequest: RedirectRequest = {
  scopes: azureScopes,
};

export const tokenRequest = (account: SilentRequest['account']): SilentRequest => ({
  account,
  scopes: tokenScopes,
});
