import { useEffect, useCallback } from 'react';
import { globalEventBus } from './mfeEventBus';
import { MfeBaseEvent, MfeDomain } from './mfeEventTypes';

/**
 * Hook to subscribe to a specific EventBus event type with automatic cleanup
 */
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

/**
 * Hook to subscribe to all events routed to or from a specific MFE domain
 */
export function useMfeDomainEvents<T = any>(
  domain: MfeDomain,
  handler: (event: MfeBaseEvent<T>) => void,
  deps: any[] = []
) {
  const memoizedHandler = useCallback(handler, deps);

  useEffect(() => {
    const unsubscribe = globalEventBus.subscribeDomain<T>(domain, memoizedHandler);
    return () => {
      unsubscribe();
    };
  }, [domain, memoizedHandler]);
}

/**
 * Hook that replays the last event on mount and listens for subsequent events
 */
export function useMfeReplayEvent<T = any>(
  eventType: string,
  handler: (event: MfeBaseEvent<T>) => void,
  deps: any[] = []
) {
  const memoizedHandler = useCallback(handler, deps);

  useEffect(() => {
    globalEventBus.replayLastEvent<T>(eventType, memoizedHandler);
    const unsubscribe = globalEventBus.subscribe<T>(eventType, memoizedHandler);
    return () => {
      unsubscribe();
    };
  }, [eventType, memoizedHandler]);
}

/**
 * Hook returning a scoped publish function for a specific MFE source domain
 */
export function useMfePublisher(sourceDomain: MfeDomain) {
  return useCallback(
    <T>(eventType: string, payload: T, targetDomain: MfeDomain = '*') => {
      return globalEventBus.publish(eventType, sourceDomain, payload, targetDomain);
    },
    [sourceDomain]
  );
}
