/**
 * Custom Hooks
 *
 * Reusable logic hooks for the Skeleton Key starter kit.
 * These are pure logic — UI is the component's job.
 *
 * Pattern: "Local state as scratchpad, backend as ledger"
 * Accumulate in state, commit clean data to backend.
 */

// Core utilities
export { default as useDebounce } from './useDebounce';
export { default as useLocalStorage } from './useLocalStorage';
export { default as useMath } from './useMath';
export { default as useMediaQuery } from './useMediaQuery';
export { default as usePrevious } from './usePrevious';
export { default as useTimer, formatTime } from './useTimer';
export { default as useToggle } from './useToggle';

// DOM & Browser
export { default as useCopyToClipboard } from './useCopyToClipboard';
export { default as useIntersectionObserver } from './useIntersectionObserver';
export { default as useInterval } from './useInterval';
export { default as useKeyPress } from './useKeyPress';
export { default as useNetworkStatus } from './useNetworkStatus';
export { default as useOnClickOutside } from './useOnClickOutside';
export { default as useScrollPosition, scrollToTop } from './useScrollPosition';
export { default as useWindowSize } from './useWindowSize';

// State management
export { default as useUndoRedo } from './useUndoRedo';
export { default as useCachedData } from './useCachedData';

// Milestone 12: Patterns & Architecture
export { default as useOptimistic } from './useOptimistic';
export { default as usePolling } from './usePolling';
// usePermission - REMOVED (depends on Skeleton Key AuthContext)
export { default as useFetch } from './useFetch';
export { default as useFormPersist } from './useFormPersist';
export { default as useErrorBoundary, useErrorHandler } from './useErrorBoundary';

// Auth (no Auth0 required)
export { default as useAdminAccess, getAdminKey } from './useAdminAccess';
