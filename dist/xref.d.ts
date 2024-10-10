export interface XrefOptions {
    swapHtml?: string;
    prefetch?: {
        isActive: boolean;
        event: string;
        delay: number;
    };
    transition?: {
        duration: number;
        delay: number;
        easing: string;
        timeline: 'sequential' | 'parallel';
        in?: TransitionDirection;
        out?: TransitionDirection;
    };
}
export interface TransitionDirection {
    from?: Record<string, string | number>;
    to?: Record<string, string | number>;
}
declare function xref(options?: XrefOptions): void;
declare namespace xref {
    var navigateTo: (url: string, isBackForward?: boolean) => void;
    var version: string;
    var defaultOptions: XrefOptions;
    var isSupported: boolean;
    var animate: typeof import("./transition").animate;
}
export default xref;
