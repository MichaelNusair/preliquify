import { createContext } from 'preact';
import { useContext } from 'preact/hooks';

export type RenderTarget = 'liquid' | 'client';

const TargetCtx = createContext<RenderTarget>('client');

export const TargetProvider = TargetCtx.Provider;
export const useTarget = () => useContext(TargetCtx);

