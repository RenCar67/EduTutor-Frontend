import { PublicClientApplication } from "@azure/msal-browser";
import { msalConfig } from "./authConfig";

export const msalInstance = new PublicClientApplication(msalConfig);

// Debe completarse antes de llamar a cualquier otro método de MSAL.
export async function initMsal() {
  await msalInstance.initialize();
  await msalInstance.handleRedirectPromise(); // procesa el regreso del login
}
