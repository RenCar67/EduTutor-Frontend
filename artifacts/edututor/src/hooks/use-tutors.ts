import { getListTutorsQueryKey, useListTutors } from '@workspace/api-client-react';
import type { Tutor } from '@workspace/api-client-react';
import { useWorkspace } from '@/components/app-shell';

// Directorio de tutores: el del workspace en modo demostración; en modo real,
// el que entrega el BFF (todos los roles pueden leerlo).
export function useTutors(): Tutor[] {
  const { mockMode, tutors } = useWorkspace();
  const query = useListTutors({ query: { enabled: !mockMode, queryKey: getListTutorsQueryKey(), staleTime: 60_000, retry: false } });
  return mockMode ? tutors : (Array.isArray(query.data) ? query.data : []);
}
