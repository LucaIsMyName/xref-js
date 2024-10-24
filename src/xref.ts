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
  media?: boolean;
  css?: boolean;
  js?: boolean;
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
      prefetch: {
        active: false,
        delay: 0,
        event: "mouseover",
        media: false,
        css: false,
        js: false,
      },
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

    // Update the body content
    await this.updateBody(newDoc);

    // Update the head content
    this.updateHead(newDoc);

    // Handle all scripts (both in head and body)
    this.handleScripts(document, newDoc);

    // Trigger a custom event to signal that the page has been updated
    const event = new CustomEvent("xrefPageUpdated");
    document.dispatchEvent(event);

    window.scrollTo(0, 0);
  }

  private updateStyles(oldDoc: Document, newDoc: Document) {
    // Get all styles from old and new documents
    const oldStyles = Array.from(oldDoc.querySelectorAll('style:not([data-xref="true"])'));
    const newStyles = Array.from(newDoc.querySelectorAll("style"));

    // Remove old styles
    oldStyles.forEach((style) => style.remove());

    // Add new styles
    newStyles.forEach((style) => {
      const newStyle = document.createElement("style");
      newStyle.textContent = style.textContent;
      // Copy any attributes
      Array.from(style.attributes).forEach((attr) => {
        newStyle.setAttribute(attr.name, attr.value);
      });
      document.head.appendChild(newStyle);
    });
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
      if (/*child.tagName !== "STYLE" &&*/ child.tagName !== "TITLE") {
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

    // Update content of swapHtml
    oldElement.innerHTML = newElement.innerHTML;
    Array.from(newElement.attributes).forEach((attr) => {
      if (attr.name !== "style") {
        oldElement.setAttribute(attr.name, attr.value);
      }
    });
  }

  /**
   * @description This method handles the scripts in the new content
   * by comparing them with the old content and adding or removing
   * scripts as needed. It also re-executes inline scripts.
   * This is necessary to ensure that the scripts are executed
   * when the new content is added to the document.
   */
  private handleScripts(oldDoc: Document, newDoc: Document) {
    const handleScriptsInElement = (oldElement: Element, newElement: Element) => {
      const oldScripts = Array.from(oldElement.querySelectorAll("script"));
      const newScripts = Array.from(newElement.querySelectorAll("script"));

      // Remove scripts that are in the old page but not in the new page
      oldScripts.forEach((script) => {
        const matchingNewScript = newScripts.find((newScript) => newScript.src === script.src && newScript.textContent === script.textContent);
        if (!matchingNewScript) {
          script.remove();
        }
      });

      // Add new scripts or re-execute existing ones
      newScripts.forEach((newScript) => {
        const existingScript = oldScripts.find((script) => script.src === newScript.src && script.textContent === script.textContent);

        if (existingScript) {
          // Re-execute inline script
          if (!newScript.src) {
            const scriptElement = document.createElement("script");
            Array.from(newScript.attributes).forEach((attr) => scriptElement.setAttribute(attr.name, attr.value));
            scriptElement.textContent = newScript.textContent;
            existingScript.parentNode?.replaceChild(scriptElement, existingScript);
          }
          // For external scripts, we create a new script element to force a reload
          else {
            const scriptElement = document.createElement("script");
            Array.from(newScript.attributes).forEach((attr) => scriptElement.setAttribute(attr.name, attr.value));
            existingScript.parentNode?.replaceChild(scriptElement, existingScript);
          }
        } else {
          // Add new script
          const scriptElement = document.createElement("script");
          Array.from(newScript.attributes).forEach((attr) => scriptElement.setAttribute(attr.name, attr.value));
          scriptElement.textContent = newScript.textContent;
          oldElement.appendChild(scriptElement);
        }

        // Remove duplicate styles
        let allStyles = document.querySelectorAll("style");
        let allStylesArray = Array.from(allStyles);
        let allStylesText = allStylesArray.map((style) => style.textContent);
        let allStylesTextSet = new Set(allStylesText);
        let allStylesTextArray = Array.from(allStylesTextSet);

        allStylesArray.forEach((style) => {
          let styleText = style.textContent;
          let styleTextIndex = allStylesTextArray.indexOf(styleText);
          if (styleTextIndex > 0) {
            style.remove();
          }
        });
      });
    };

    // Handle scripts in the head
    handleScriptsInElement(oldDoc.head, newDoc.head);

    // Handle scripts in the body
    handleScriptsInElement(oldDoc.body, newDoc.body);
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

    // Calculate total transition time for all phases
    const partialsOutsideSwapHtml = this.getPartialsOutsideSwapHtml();
    const totalDuration =
      (partialsOutsideSwapHtml.length > 0 ? duration : 0) + // partials out
      (outTransition ? duration : 0) + // swap html out
      (inTransition ? duration : 0) + // swap html in
      (partialsOutsideSwapHtml.length > 0 ? duration : 0); // partials in

    // Track elapsed time
    let elapsedTime = 0;

    // 1. Animate partials "out"
    if (partialsOutsideSwapHtml.length > 0) {
      this.options.debug ? console.log("Applying partial out transitions") : null;
      const partialsOutPromise = handlePartials(partialsOutsideSwapHtml, document.body, document.body, this.options, "out");
      await partialsOutPromise;
      elapsedTime += duration;
      hidePartials(partialsOutsideSwapHtml, document.body);
    }

    // 2. Animate swapHtml out
    if (outTransition) {
      this.options.debug ? console.log("Applying main out transition") : null;
      await this.applyTransition(oldElement, outTransition, duration, delay, easing, "out");
      elapsedTime += duration;
    }

    // Check if we've reached the midpoint
    if (elapsedTime >= totalDuration / 2) {
      // We've passed the midpoint - update styles now
      if (this.options.head?.update && this.options.head?.retrigger?.css) {
        const parser = new DOMParser();
        const newDoc = parser.parseFromString(newElement.ownerDocument.documentElement.outerHTML, "text/html");
        this.updateStyles(document, newDoc);
      }
    }

    // Update content of swapHtml
    oldElement.innerHTML = newElement.innerHTML;
    Array.from(newElement.attributes).forEach((attr) => {
      if (attr.name !== "style") {
        oldElement.setAttribute(attr.name, attr.value);
      }
    });

    // If we haven't reached midpoint yet, wait for it
    if (elapsedTime < totalDuration / 2) {
      const timeToMidpoint = totalDuration / 2 - elapsedTime;
      await new Promise((resolve) => setTimeout(resolve, timeToMidpoint));
      if (this.options.head?.update && this.options.head?.retrigger?.css) {
        const parser = new DOMParser();
        const newDoc = parser.parseFromString(newElement.ownerDocument.documentElement.outerHTML, "text/html");
        this.updateStyles(document, newDoc);
      }
    }

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

  /**
   * 
   * @description This method returns the partials that are outside
   * the swapHtml element. This is useful for handling transitions
   * on elements that are not part of the main content.
   */
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
  // Current implementation relies on setTimeout and animationend events
  // Recommendation: Use requestAnimationFrame for smoother animations

  /**
   * @description This method sets the transition state
   * based on the given key and value. This is useful
   * for tracking the state of the transition.
   */
  private setTransitionState(key: keyof AnimationState, value: boolean) {
    this.animationState[key] = value;
  }

  /**
   *
   * @description This method runs the callback with the given name
   * if it exists in the transition options. This is useful for
   * running custom code at different stages of the transition.
   */
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

/**
 * @description This function creates a new Xref instance
 * with the given options and returns it. This is the main
 * entry point for using Xref in a project.
 */
function xref(options: XrefOptions = {}): Xref {
  return new Xref(options);
}

export default xref;
