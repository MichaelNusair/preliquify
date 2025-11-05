import { createContext } from 'preact';
import { useContext, useMemo, useState, useCallback, FunctionComponent } from 'preact/hooks';
import { ComponentChildren } from 'preact'; // Correct type for children in Preact

// Re-export everything from @preliquify/core as per the original file's intention.
export * from '@preliquify/core';

/**
 * @interface ICoreContextValue
 * @description Defines the shape of the context value provided by CoreProvider.
 * This interface is a placeholder and should be adapted to the specific needs
 * of the @preliquify/core library. It typically includes client instances,
 * configuration, and core utilities or state.
 */
interface ICoreContextValue {
  /** An example client instance, e.g., an API client. */
  client: any;
  /** Configuration object for the core library. */
  config: { [key: string]: any };
  /** A generic action function provided by the core. */
  performAction: (data: string) => void;
  /** An example counter to demonstrate state management within the provider. */
  counter: number;
  /** Function to increment the example counter. */
  incrementCounter: () => void;
  // Add any other core-related state, instances, or functions here.
}

/**
 * @constant defaultCoreContextValue
 * @description The default value for CoreContext. This value is used when a
 * component consumes the context but is not wrapped by a CoreProvider.
 * It provides a fallback and is crucial for type safety.
 */
const defaultCoreContextValue: ICoreContextValue = {
  client: null, // No client instance by default
  config: {},
  performAction: (data: string) => {
    // console.warn('performAction called without CoreProvider. This is a no-op.');
    console.log(`[Default Core Context] Performing action with data: ${data}`);
  },
  counter: 0,
  incrementCounter: () => {
    // console.warn('incrementCounter called without CoreProvider. This is a no-op.');
  },
};

/**
 * @constant CoreContext
 * @description The Preact Context object for the core library.
 * Components can use `useContext(CoreContext)` or `<CoreContext.Consumer>` to access its value.
 */
const CoreContext = createContext<ICoreContextValue>(defaultCoreContextValue);

/**
 * @interface CoreProviderProps
 * @description Props for the CoreProvider component.
 */
interface CoreProviderProps {
  /** Child components to be rendered within the provider's scope. */
  children: ComponentChildren;
  /**
   * Optional initial values to merge into the context.
   * Specific properties (like `counter`) might be managed internally by the provider
   * and override values from `initialValue`.
   */
  initialValue?: Partial<ICoreContextValue>;
}

/**
 * @component CoreProvider
 * @description A Preact component that provides the core context to its children.
 * It manages internal state (like `counter`) and ensures the context value is
 * referentially stable using `useMemo` to prevent unnecessary re-renders of consumers.
 */
const CoreProvider: FunctionComponent<CoreProviderProps> = ({ children, initialValue }) => {
  // Example of internal state managed by the provider.
  const [counter, setCounter] = useState(initialValue?.counter || 0);

  // Memoize the increment function to ensure referential stability,
  // preventing unnecessary re-renders of components that depend on it.
  const incrementCounter = useCallback(() => setCounter(c => c + 1), []);

  // Memoize the entire context value object. This is critical for performance
  // and stability in context-heavy applications, preventing consumers from
  // re-rendering if the object itself hasn't changed references, even if
  // its properties might have. The `value` prop of `<Context.Provider>`
  // should always be referentially stable if possible.
  const memoizedValue = useMemo<ICoreContextValue>(() => {
    return {
      ...defaultCoreContextValue, // Start with defaults
      ...initialValue,           // Apply initial values provided by props
      // Override with internally managed state/functions
      counter,
      incrementCounter,
      // If `initialValue` provides a custom `performAction`, use it, otherwise fall back to default.
      performAction: initialValue?.performAction || defaultCoreContextValue.performAction,
    };
  }, [initialValue, counter, incrementCounter]); // Dependencies for memoization

  return (
    <CoreContext.Provider value={memoizedValue}>
      {children}
    </CoreContext.Provider>
  );
};

/**
 * @hook useCore
 * @description A custom Preact hook to conveniently access the core context value.
 * It throws an error if used outside of a CoreProvider, enforcing correct usage.
 * @returns {ICoreContextValue} The current core context value.
 * @throws {Error} If called outside of a CoreProvider.
 */
const useCore = (): ICoreContextValue => {
  const context = useContext(CoreContext);

  // Enforce that `useCore` is called within a `CoreProvider`.
  // This helps catch common integration errors early during development.
  if (context === defaultCoreContextValue) {
    throw new Error('`useCore` must be used within a `CoreProvider`.');
  }

  return context;
};

// Export the context, provider component, and consumer hook for public use.
export {
  CoreContext,
  CoreProvider,
  useCore,
};