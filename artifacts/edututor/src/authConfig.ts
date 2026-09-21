// Login real contra el tenant de Entra External ID (mismo tenant y patrón
// validados en portal-tallerpro360), usando el registro de app de EduTutor.
const SUBDOMINIO = "whateverdom";
const TENANT_ID = "a8235d1f-255d-4c0c-8a1c-eed1b072689c";
const CLIENT_ID = "dd2d3936-1191-4be9-843c-eb262c3b24a1";

export const msalConfig = {
  auth: {
    clientId: CLIENT_ID,
    authority: `https://${SUBDOMINIO}.ciamlogin.com/${TENANT_ID}`,
    knownAuthorities: [
      `${SUBDOMINIO}.ciamlogin.com`,
      `${TENANT_ID}.ciamlogin.com`,
    ],
    redirectUri: window.location.origin + window.location.pathname,
    postLogoutRedirectUri: window.location.origin + window.location.pathname,
    navigateToLoginRequestUrl: false,
  },
  cache: { cacheLocation: "sessionStorage" as const },
};

export const loginRequest = {
  scopes: ["openid", "profile", "email", "offline_access"],
};

export const apiRequest = {
  scopes: ["api://2f150108-cdc6-4386-82cf-f1b957ff99fb/access_as_user"],
};

// Roles canónicos definidos como App Roles en Azure / esperados por el BFF.
export const CANONICAL_ROLES = ["ADMIN", "COORDINADOR", "ESTUDIANTE", "AUDITOR"] as const;
export type CanonicalRole = (typeof CANONICAL_ROLES)[number];
