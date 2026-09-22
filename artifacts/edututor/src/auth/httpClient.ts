import axios, { type InternalAxiosRequestConfig } from 'axios';
import { bffApiBaseUrl } from './authConfig';

type BffContext = {
  userId: string;
  userRole: string;
};

type InterceptorConfig = {
  getAccessToken: () => Promise<string | null>;
  getContext: () => BffContext | null;
};

let getAccessToken = async (): Promise<string | null> => null;
let getContext = (): BffContext | null => null;

export const bffClient = axios.create({
  baseURL: bffApiBaseUrl,
  headers: {
    Accept: 'application/json',
  },
});

export function configureBffInterceptor(config: InterceptorConfig): void {
  getAccessToken = config.getAccessToken;
  getContext = config.getContext;
}

async function addBffHeaders(config: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig> {
  const token = await getAccessToken();
  const context = getContext();

  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  if (context) {
    config.headers.set('X-User-Id', context.userId);
    config.headers.set('X-User-Role', context.userRole);
  }

  return config;
}

bffClient.interceptors.request.use(addBffHeaders);
