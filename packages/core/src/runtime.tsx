import { createContext } from "preact";
import { useContext } from "preact/hooks";

export type RenderTarget = "liquid" | "client";

const TargetCtx = createContext<RenderTarget>("client");

export const TargetProvider = TargetCtx.Provider;
export const useTarget = (): RenderTarget => {
    try {
        const target = useContext(TargetCtx);
        // Ensure we got a valid target value
        if (target === "liquid" || target === "client") {
            return target;
        }
        // Fallback if context returns unexpected value
        return "liquid";
    } catch (error) {
        // If useContext fails (e.g., called outside Preact context during SSR),
        // default to "liquid" since this typically happens during build-time SSR
        // when createLiquidSnippet's ComponentSSR is called without proper
        // Preact context setup. The context should always be available during
        // normal rendering via TargetProvider.
        return "liquid";
    }
};
