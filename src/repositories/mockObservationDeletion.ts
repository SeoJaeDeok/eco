// Session-only tombstones; never mutate bundled samples or persist fixture data.
export const deletedMockObservationIds = new Set<string>();
const listeners = new Set<(id: string) => void>();
export const onMockObservationDeleted = (listener: (id: string) => void) => {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
};
export const markMockObservationDeleted = (id: string) => {
  deletedMockObservationIds.add(id);
  for (const listener of listeners) listener(id);
};
