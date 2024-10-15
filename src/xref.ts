import { Prefetcher, initPrefetcher } from "./prefetch";
import { handlePartials, hidePartials, showPartials } from "./partials";
import { camelToKebab } from "./utils";

export interface XrefOptions {
  debug?: boolean;
  updateHead?: boolean;
  transition?: TransitionOptions;
  prefetch?: PrefetchOptions;
  head?: HeadOptions;
}

export interface HeadOptions {
  update?: boolean;
  retrigger?: {
    css?: boolean;
    js?: boolean;
    include?: string | RegExp;
    exclude?: string | RegExp;
  };
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
  state?: AnimationState;
  swapHtml?: string;
  partials?: PartialTransition[];
}

export interface PartialTransition {
  element: string;
  duration?: number;
  delay?: number;
  easing?: string;
  in?: TransitionState;
  out?: TransitionState;
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
class Xref {
  private options: XrefOptions;
  private styleElement: HTMLStyleElement;
  private transitionCounter: number = 0;
  private prefetcher: Prefetcher | null = null;
  private animationState: AnimationState;

  /**
   * @description This is the constructor of the Xref class.
   * It initializes the Xref instance with the given options,
   * creates a style element to store the keyframes for transitions,
   * and sets the initial animation state.
   */
  constructor(options: XrefOptions = {}) {
    this.options = {
      updateHead: true,
      ...options,
    };
    this.styleElement = document.createElement("style");
    this.styleElement.setAttribute("data-xref", "true");
    document.head.appendChild(this.styleElement);
    this.animationState = {
      started: false,
      playing: true,
      paused: false,
      finished: false,
      ...(this.options.transition?.state as Partial<AnimationState>),
    };
    this.init();
  }

  /**
   * @description This method initializes the Xref instance
   * by intercepting clicks on internal links, handling popstate events,
   * and initializing the prefetcher if prefetching is enabled.
   */
  private init() {
    this.options.debug ? console.log("started -> init() Method") : null;

    this.interceptClicks();
    this.handlePopState();

    if (this.options.prefetch && this.options.prefetch.active) {
      this.prefetcher = initPrefetcher(this.options.prefetch, this.options);
    }
  }

  private currentKeyframeName: string | null = null;

  /**
   * @description This method creates keyframes
   * for the given transition state
   * and direction.
   */
  private createKeyframes(transitionState: TransitionState, direction: "in" | "out"): string {
    const { from, to } = transitionState;
    const keyframeName = `xref-${direction}-${++this.transitionCounter}`;

    let keyframeCSS = `@keyframes ${keyframeName} {
      from {
        ${Object.entries(from || {})
          .map(([key, value]) => `${camelToKebab(key)}: ${value};`)
          .join(" ")}
      }
      to {
        ${Object.entries(to || {})
          .map(([key, value]) => `${camelToKebab(key)}: ${value};`)
          .join(" ")}
      }
    }`;

    this.options.debug ? console.log("Creating keyframe:" + keyframeName) : null;
    this.options.debug ? console.log("Keyframe CSS:" + keyframeCSS) : null;

    // Remove the previous keyframe if it exists
    if (this.currentKeyframeName) {
      this.removeKeyframes(this.currentKeyframeName);
    }

    // Append the new keyframe to the style element's content
    this.styleElement.textContent = keyframeCSS;
    this.currentKeyframeName = keyframeName;

    this.options.debug ? console.log("Keyframe " + keyframeName + "appended to <style> element") : null;
    this.options.debug ? console.log("Current <style> content: " + this.styleElement.textContent) : null;

    return keyframeName;
  }

  /**
   * @param keyframeName
   * @description This method removes the keyframes
   * with the given name from the style element.
   */
  private removeKeyframes(keyframeName: string) {
    this.options.debug ? console.log("Removing keyframe: " + keyframeName) : null;
    this.styleElement.textContent = "";
    this.options.debug ? console.log("Keyframe" + keyframeName + "removed") : null;
    this.options.debug ? console.log("Current <style> content after removal:" + this.styleElement.textContent) : null;
    this.currentKeyframeName = null;
  }

  /**
   * @description This method intercepts clicks
   * on internal links and prevents the default
   * browser navigation behavior.
   */
  private interceptClicks() {
    this.options.debug ? console.log("started -> interceptClicks() Method") : null;

    document.addEventListener("click", (event) => {
      const target = event.target as HTMLElement;
      const anchor = target.closest("a");
      if (anchor && this.shouldIntercept(anchor as HTMLAnchorElement)) {
        event.preventDefault();
        this.runCallback("onEnter");
        this.navigate(anchor.href);
      }
    });
  }

  /**
   * @description This method checks if the
   * anchor should be intercepted based on
   * the current URL and the anchor's href.
   */
  private shouldIntercept(anchor: HTMLAnchorElement): boolean {
    this.options.debug ? console.log("started -> shouldIntercept() Method") : null;

    const currentUrl = new URL(window.location.href);
    const linkUrl = new URL(anchor.href);

    // Check if it's an internal link
    const isSameOrigin = linkUrl.origin === currentUrl.origin;

    // Check if it's not the current page or just a hash change
    const isSamePage = linkUrl.pathname === currentUrl.pathname && linkUrl.search === currentUrl.search;
    const isJustHashChange = isSamePage && linkUrl.hash !== currentUrl.hash;

    // Intercept only if it's an internal link and not the same page or just a hash change
    return isSameOrigin && !isSamePage && !isJustHashChange;
  }

  /**
   * @description This method handles popstate events
   * to support back and forward navigation.
   */
  private handlePopState() {
    this.options.debug ? console.log("started -> handlePopState() Method") : null;

    window.addEventListener("popstate", () => {
      this.navigate(window.location.href, false);
    });
  }

  /**
   * @description This method navigates to the given URL
   * and updates the page content. If prefetching is enabled
   * and the content is already prefetched, it uses the
   * prefetched content instead of fetching it again.
   * If pushState is true, it updates the browser history.
   */
  public async navigate(url: string, pushState: boolean = true) {
    this.options.debug ? console.log("started -> navigate() Method") : null;

    try {
      let content: string | null = null;
      if (this.prefetcher) {
        content = this.prefetcher.getContent(url);
      }

      if (!content) {
        content = await this.fetchPage(url);
      }

      if (content) {
        if (pushState) {
          history.pushState(null, "", url);
        }
        this.updatePage(content);
      }
    } catch (error) {
      this.options.debug ? console.error("Navigation failed:", error) : null;
    }
  }

  /**
   * @description This method fetches the content of the given URL
   * and returns it as a string. It throws an error if the request fails.
   */
  private async fetchPage(url: string): Promise<string> {
    this.options.debug ? console.log("started -> fetchPage() Method") : null;

    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.text();
  }

  /**
   * @description This method updates the page content
   * with the new content fetched from the server.
   * It updates the head and body of the document
   * based on the new content.
   */
  private async updatePage(content: string) {
    this.options.debug ? console.log("started -> updatePage() Method") : null;

    const parser = new DOMParser();
    const newDoc = parser.parseFromString(content, "text/html");

    await this.updateBody(newDoc);
    this.updateHead(newDoc);
  }

  /**
   * @description This method updates the head of the document
   * with the new head from the fetched content. It updates
   * the title and other head elements based on the new content.
   */
  private updateHead(newDoc: Document) {
    this.options.debug ? console.log("started -> updateHead() Method") : null;

    const oldHead = document.head;
    const newHead = newDoc.head;

    // Always update the title
    document.title = newDoc.title;

    if (this.options.head?.update === false) {
      return;
    }

    // Remove old elements except our style element and title
    Array.from(oldHead.children).forEach((child) => {
      if (child !== this.styleElement && child.tagName !== "TITLE") {
        child.remove();
      }
    });

    // Add new elements
    Array.from(newHead.children).forEach((child) => {
      if (child.tagName !== "STYLE" && child.tagName !== "TITLE") {
        const newChild = child.cloneNode(true) as HTMLElement;
        oldHead.appendChild(newChild);
        this.retriggerElement(newChild);
      }
    });

    this.options.debug ? console.log("Head updated, xref style element preserved") : null;
  }

  private retriggerElement(element: HTMLElement) {
    const { retrigger } = this.options.head || {};
    if (!retrigger) return;

    const shouldRetrigger = (el: HTMLElement): boolean => {
      if (retrigger.include && !el.matches(retrigger.include.toString())) return false;
      if (retrigger.exclude && el.matches(retrigger.exclude.toString())) return false;
      return true;
    };

    if (element.tagName === "LINK" && retrigger.css && shouldRetrigger(element)) {
      const link = element as HTMLLinkElement;
      link.href = link.href.split("?")[0] + "?t=" + new Date().getTime();
    } else if (element.tagName === "SCRIPT" && retrigger.js && shouldRetrigger(element)) {
      const script = element as HTMLScriptElement;
      const newScript = document.createElement("script");
      Array.from(script.attributes).forEach((attr) => newScript.setAttribute(attr.name, attr.value));
      newScript.textContent = script.textContent;
      script.parentNode?.replaceChild(newScript, script);
    }
  }

  /**
   * @description This method updates the body of the document
   * with the new body from the fetched content. It updates
   * the content of the swapHtml element based on the new content.
   * It also performs the transition between the old and new content.
   */
  private async updateBody(newDoc: Document) {
    this.options.debug ? console.log("started -> updateBody() Method") : null;

    const swapHtml = this.options.transition?.swapHtml || "body";
    const oldElement = document.querySelector(swapHtml);
    const newElement = newDoc.querySelector(swapHtml);

    if (!oldElement || !newElement) {
      this.options.debug ? console.error(`Element not found: ${swapHtml}`) : null;
      return;
    }

    await this.performTransition(oldElement as HTMLElement, newElement as HTMLElement);

    window.scrollTo(0, 0);
  }

  /**
   * @description This method performs the transition
   * between the old and new content by applying the
   * in and out transitions to the elements.
   * It also handles the transition timeline, duration,
   * delay, and easing.
   */
  private async performTransition(oldElement: HTMLElement, newElement: HTMLElement) {
    this.options.debug ? console.log("Started performTransition") : null;
    const transitionOptions = this.options.transition || {};
    const duration = transitionOptions.duration || 300;
    const delay = transitionOptions.delay || 0;
    const easing = transitionOptions.easing || "ease-in-out";

    let outTransition = transitionOptions.out;
    let inTransition = transitionOptions.in;

    this.setTransitionState("started", true);
    this.runCallback("onStart");

    // Get partials outside swapHtml
    const partialsOutsideSwapHtml = this.getPartialsOutsideSwapHtml();

    // 1. Animate partials "out"
    if (partialsOutsideSwapHtml.length > 0) {
      this.options.debug ? console.log("Applying partial out transitions") : null;
      const partialsOutPromise = handlePartials(partialsOutsideSwapHtml, document.body, document.body, this.options, "out");

      // Wait for the longest partial out animation to complete
      await partialsOutPromise;

      // Hide partials after out animations
      hidePartials(partialsOutsideSwapHtml, document.body);
    }

    // 2. Animate swapHtml out
    if (outTransition) {
      this.options.debug ? console.log("Applying main out transition") : null;
      await this.applyTransition(oldElement, outTransition, duration, delay, easing, "out");
    }

    // Update content of swapHtml
    oldElement.innerHTML = newElement.innerHTML;
    Array.from(newElement.attributes).forEach((attr) => {
      if (attr.name !== "style") {
        oldElement.setAttribute(attr.name, attr.value);
      }
    });

    // 3. Animate swapHtml in
    if (inTransition) {
      this.options.debug ? console.log("Applying main in transition") : null;
      await this.applyTransition(oldElement, inTransition, duration, delay, easing, "in");
    }

    // 4. Animate partials "in"
    if (partialsOutsideSwapHtml.length > 0) {
      hidePartials(partialsOutsideSwapHtml, document.body);
      await handlePartials(partialsOutsideSwapHtml, document.body, document.body, this.options, "in");
    }

    // 5. Partials visible and DOM is ready with new Page
    this.setTransitionState("finished", true);
    this.runCallback("onFinish");

    window.scrollTo(0, 0);
  }

  private getPartialsOutsideSwapHtml(): PartialTransition[] {
    const swapHtml = this.options.transition?.swapHtml || "body";
    const swapHtmlElement = document.querySelector(swapHtml);

    return (this.options.transition?.partials || []).filter((partial) => {
      const elements = document.querySelectorAll(partial.element);
      return Array.from(elements).every((el) => !swapHtmlElement?.contains(el));
    });
  }

  /**
   * @description This method reverses the given transition
   * by swapping the from and to states. This is useful
   * for creating the "out" transition from the "in" transition.
   */
  private reverseTransition(transition: TransitionState): TransitionState {
    return {
      from: transition.to,
      to: transition.from,
    };
  }

  /**
   * @description This method applies the transition to the element
   * by creating the keyframes, setting the animation properties,
   * and cleaning up after the animation is complete.
   */
  private applyTransition(element: HTMLElement, transitionState: TransitionState, duration: number, delay: number, easing: string, direction: "in" | "out"): Promise<void> {
    return new Promise((resolve) => {
      this.options.debug ? console.log(`Applying ${direction} transition`) : null;
      const keyframeName = this.createKeyframes(transitionState, direction);
      const animationCSS = `${keyframeName} ${duration}ms ${easing} ${delay}ms forwards`;

      element.style.setProperty("animation", animationCSS);
      this.options.debug ? console.log(`Applied ${direction} animation: ${animationCSS}`) : null;
      this.options.debug ? console.log("Current element style:", element.style.cssText) : null;

      // Force a reflow to ensure the animation is applied immediately
      void element.offsetWidth;

      const cleanup = () => {
        this.options.debug ? console.log(`Animation end event fired for ${direction} transition`) : null;
        element.style.removeProperty("animation");

        // Remove the keyframe immediately after the animation is complete
        this.removeKeyframes(keyframeName);

        if (direction === "in") {
          Object.entries(transitionState.to || {}).forEach(([key, value]) => {
            element.style.setProperty(camelToKebab(key), value as string);
          });
        }
        this.options.debug ? console.log(`Cleaned up ${direction} animation`) : null;
        this.options.debug ? console.log("Current element style after cleanup:", element.style.cssText) : null;

        resolve();
      };

      element.addEventListener("animationend", cleanup, { once: true });
    });
  }

  /**
   * @description This method sets the transition state
   * based on the given key and value. This is useful
   * for tracking the state of the transition.
   */
  private setTransitionState(key: keyof AnimationState, value: boolean) {
    this.animationState[key] = value;
  }

  private runCallback(callbackName: keyof TransitionCallbacks) {
    const callback = this.options.transition?.callback?.[callbackName];
    if (callback && typeof callback === "function") {
      callback();
    }
  }

  /**
   * @description This method starts the transition
   * and sets the animation state accordingly.
   */
  public startTransition() {
    this.setTransitionState("started", true);
    this.setTransitionState("playing", true);
    this.setTransitionState("paused", false);
    this.setTransitionState("finished", false);
    this.runCallback("onStart");
    this.runCallback("onPlay");
  }

  /**
   * @description This method pauses the transition
   * and sets the animation state accordingly.
   */
  public pauseTransition() {
    if (this.animationState.playing) {
      this.setTransitionState("playing", false);
      this.setTransitionState("paused", true);
      this.runCallback("onPause");

      // Pause transition
      const element = document.querySelector(this.options.transition?.swapHtml || "body");
      if (element instanceof HTMLElement) {
        element.style.animationPlayState = "paused";
      }
    }
  }

  /**
   * @description This method resumes the transition
   * and sets the animation state accordingly.
   */
  public resumeTransition() {
    if (this.animationState.paused) {
      this.setTransitionState("playing", true);
      this.setTransitionState("paused", false);
      this.runCallback("onPlay");

      // Play transition
      const element = document.querySelector(this.options.transition?.swapHtml || "body");
      if (element instanceof HTMLElement) {
        element.style.animationPlayState = "running";
      }
    }
  }

  /**
   * @description This method finishes the transition
   * and cleans up the animation
   * */
  public finishTransition() {
    this.setTransitionState("playing", false);
    this.setTransitionState("paused", false);
    this.setTransitionState("finished", true);
    this.runCallback("onFinish");
  }
}

function xref(options: XrefOptions = {}): Xref {
  return new Xref(options);
}

export default xref;
