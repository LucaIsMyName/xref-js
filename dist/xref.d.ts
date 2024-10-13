export interface XrefOptions {
    debug?: boolean;
    updateHead?: boolean;
    transition?: TransitionOptions;
    prefetch?: PrefetchOptions;
}
export interface PrefetchOptions {
    active: boolean;
    delay: number;
    event: string;
    selector?: string;
}
export interface TransitionOptions {
    duration?: number;
    delay?: number;
    easing?: string;
    timeline?: "sequential" | "parallel";
    in?: TransitionState;
    out?: TransitionState;
    callback?: TransitionCallbacks;
    state?: TransitionState;
    swapHtml?: string;
}
export interface TransitionState {
    from?: Record<string, string | number>;
    to?: Record<string, string | number>;
}
export interface AnimationState {
    started: boolean;
    playing: boolean;
    paused: boolean;
    finished: boolean;
}
export interface TransitionCallbacks {
    onEnter?: () => void;
    onStart?: () => void;
    onPlay?: () => void;
    onPause?: () => void;
    onFinish?: () => void;
}
/**
 * The main Xref class that handles
 * navigation and transitions.
 *
 * @returns The Xref instance.
 *
 * @description This is the main class that handles navigation and transitions.
 * It intercepts clicks on internal links, fetches the content of the linked page,
 * updates the document head and body, and performs transitions between the
 * old and new content. It also handles popstate events to support back
 * and forward navigation.
 */
declare class Xref {
    private options;
    private styleElement;
    private transitionCounter;
    private prefetcher;
    private animationState;
    /**
     * @description This is the constructor of the Xref class.
     * It initializes the Xref instance with the given options,
     * creates a style element to store the keyframes for transitions,
     * and sets the initial animation state.
     */
    constructor(options?: XrefOptions);
    /**
     * @description This method initializes the Xref instance
     * by intercepting clicks on internal links, handling popstate events,
     * and initializing the prefetcher if prefetching is enabled.
     */
    private init;
    private currentKeyframeName;
    /**
     * @description This method creates keyframes
     * for the given transition state
     * and direction.
     */
    private createKeyframes;
    /**
     * @param keyframeName
     * @description This method removes the keyframes
     * with the given name from the style element.
     */
    private removeKeyframes;
    /**
     * @description This method intercepts clicks
     * on internal links and prevents the default
     * browser navigation behavior.
     */
    private interceptClicks;
    /**
     * @description This method checks if the
     * anchor should be intercepted based on
     * the current URL and the anchor's href.
     */
    private shouldIntercept;
    /**
     * @description This method handles popstate events
     * to support back and forward navigation.
     */
    private handlePopState;
    /**
     * @description This method navigates to the given URL
     * and updates the page content. If prefetching is enabled
     * and the content is already prefetched, it uses the
     * prefetched content instead of fetching it again.
     * If pushState is true, it updates the browser history.
     */
    navigate(url: string, pushState?: boolean): Promise<void>;
    /**
     * @description This method fetches the content of the given URL
     * and returns it as a string. It throws an error if the request fails.
     */
    private fetchPage;
    /**
     * @description This method updates the page content
     * with the new content fetched from the server.
     * It updates the head and body of the document
     * based on the new content.
     */
    private updatePage;
    /**
     * @description This method updates the head of the document
     * with the new head from the fetched content. It updates
     * the title and other head elements based on the new content.
     */
    private updateHead;
    /**
     * @description This method updates the body of the document
     * with the new body from the fetched content. It updates
     * the content of the swapHtml element based on the new content.
     * It also performs the transition between the old and new content.
     */
    private updateBody;
    /**
     * @description This method performs the transition
     * between the old and new content by applying the
     * in and out transitions to the elements.
     * It also handles the transition timeline, duration,
     * delay, and easing.
     */
    private performTransition;
    /**
     * @description This method reverses the given transition
     * by swapping the from and to states. This is useful
     * for creating the "out" transition from the "in" transition.
     */
    private reverseTransition;
    /**
     * @description This method applies the transition to the element
     * by creating the keyframes, setting the animation properties,
     * and cleaning up after the animation is complete.
     */
    private applyTransition;
    /**
     * @description This method sets the transition state
     * based on the given key and value. This is useful
     * for tracking the state of the transition.
     */
    private setTransitionState;
    private runCallback;
    /**
     * @description This method starts the transition
     * and sets the animation state accordingly.
     */
    startTransition(): void;
    /**
     * @description This method pauses the transition
     * and sets the animation state accordingly.
     */
    pauseTransition(): void;
    /**
     * @description This method resumes the transition
     * and sets the animation state accordingly.
     */
    resumeTransition(): void;
    /**
     * @description This method finishes the transition
     * and cleans up the animation
     * */
    finishTransition(): void;
    /**
     * @description This method converts
     * camel case to kebab case
     */
    camelToKebab(str: string): string;
}
declare function xref(options?: XrefOptions): Xref;
export default xref;
