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
    private styleElement;
    private transitionCounter;
    constructor(options?: XrefOptions);
    private init;
    private currentKeyframeName;
    private createKeyframes;
    private removeKeyframes;
    private removeUnusedKeyframes;
    private removeInlineStylesFromRoot;
    private interceptClicks;
    private shouldIntercept;
    private handlePopState;
    navigate(url: string, pushState?: boolean): Promise<void>;
    private fetchPage;
    private updatePage;
    private updateHead;
    private updateBody;
    private performTransition;
    private reverseTransition;
    private applyTransition;
    camelToKebab(str: string): string;
}
declare function xref(options?: XrefOptions): Xref;
export default xref;
