import type { Configuration, RedirectRequest, SilentRequest } from '@azure/msal-browser';

// Credenciales oficiales de Entra External ID (mismo tenant y patrón validados en portal-tallerpro360)
const SUBDOMINIO = 'whateverdom';
const DEFAULT_TENANT_ID = 'a8235d1f-255d-4c0c-8a1c-eed1b072689c';
const DEFAULT_CLIENT_ID = 'dd2d3936-1191-4be9-843c-eb262c3b24a1';
const DEFAULT_BFF_SCOPE = 'api://2f150108-cdc6-4386-82cf-f1b957ff99fb/access_as_user';

const clientId = import.meta.env.VITE_AZURE_CLIENT_ID?.trim() || DEFAULT_CLIENT_ID;
const tenantId = import.meta.env.VITE_AZURE_TENANT_ID?.trim() || DEFAULT_TENANT_ID;
// Siempre el origen sin path: es una SPA de una sola página servida en "/"
// (con rutas cliente como /login, /catalog, etc.) — usar la pathname actual
// aquí produce un redirect_uri distinto según desde qué ruta se inicie sesión,
// y solo el origen raíz está registrado en Azure (AADSTS50011 si no calzan).
const redirectUri = import.meta.env.VITE_AZURE_REDIRECT_URI?.trim() || window.location.origin;
const bffScope = import.meta.env.VITE_AZURE_BFF_SCOPE?.trim() || DEFAULT_BFF_SCOPE;

export const azureConfigured = Boolean(clientId && tenantId);
export const bffApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() || '/api/v1';
export const azureScopes = ['openid', 'profile', 'email', 'offline_access', ...(bffScope ? [bffScope] : [])];
export const tokenScopes = bffScope ? [bffScope] : ['User.Read'];

export const msalConfig: Configuration = {
  auth: {
    clientId,
    authority: `https://${SUBDOMINIO}.ciamlogin.com/${tenantId}`,
    knownAuthorities: [
      `${SUBDOMINIO}.ciamlogin.com`,
      `${tenantId}.ciamlogin.com`,
    ],
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

export const apiRequest = {
  scopes: [bffScope],
};

export const tokenRequest = (account: SilentRequest['account']): SilentRequest => ({
  account,
  scopes: tokenScopes,
});

// Roles canónicos definidos como App Roles en Azure / esperados por el BFF.
export const CANONICAL_ROLES = ['ADMIN', 'COORDINADOR', 'ESTUDIANTE', 'AUDITOR'] as const;
export type CanonicalRole = (typeof CANONICAL_ROLES)[number];
