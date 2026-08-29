import { useEffect, useCallback } from 'react';
import { globalEventBus } from './mfeEventBus';
import { MfeBaseEvent, MfeDomain } from './mfeEventTypes';

export function useMfeEvent<T = any>(
  eventType: string,
  handler: (event: MfeBaseEvent<T>) => void,
  deps: any[] = []
) {
  const memoizedHandler = useCallback(handler, deps);

  useEffect(() => {
    const unsubscribe = globalEventBus.subscribe<T>(eventType, memoizedHandler);
    return () => {
      unsubscribe();
    };
  }, [eventType, memoizedHandler]);
}

export function useMfePublisher(sourceDomain: MfeDomain) {
  return useCallback(
    <T>(eventType: string, payload: T, targetDomain: MfeDomain = '*') => {
      return globalEventBus.publish(eventType, sourceDomain, payload, targetDomain);
    },
    [sourceDomain]
  );
}
