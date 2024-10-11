interface XrefOptions {
    updateHead?: boolean;
    swapHtml?: string;
    transition?: TransitionOptions;
}
interface TransitionOptions {
    duration?: number;
    delay?: number;
    easing?: string;
    timeline?: "sequential" | "parallel";
    in?: TransitionState;
    out?: TransitionState;
}
interface TransitionState {
    from?: Record<string, string | number>;
    to?: Record<string, string | number>;
}
declare class Xref {
    private options;
    private tailwindStyleElement;
    constructor(options?: XrefOptions);
    private init;
    private removeInlineStylesFromRoot;
    private initTailwindStyle;
    private interceptClicks;
    private shouldIntercept;
    private handlePopState;
    navigate(url: string, pushState?: boolean): Promise<void>;
    private fetchPage;
    private updatePage;
    private updateHead;
    private updateBody;
    private performTransition;
    private applyTransition;
    private camelToKebab;
}
declare function xref(options?: XrefOptions): Xref;
export default xref;
