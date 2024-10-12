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

class Xref {
  private options: XrefOptions;
  private styleElement: HTMLStyleElement;
  private transitionCounter: number = 0;

  constructor(options: XrefOptions = {}) {
    this.options = {
      updateHead: true,
      ...options,
    };
    this.styleElement = document.createElement("style");
    this.styleElement.setAttribute("data-xref", "true");
    document.head.appendChild(this.styleElement);
    this.init();
  }

  private init() {
    console.log("started -> init() Method");

    this.interceptClicks();
    this.handlePopState();
  }

  // private currentKeyframes: { in?: string; out?: string } = {};
  private currentKeyframeName: string | null = null;

  private createKeyframes(transitionState: TransitionState, direction: "in" | "out"): string {
    const { from, to } = transitionState;
    const keyframeName = `xref-${direction}-${++this.transitionCounter}`;

    let keyframeCSS = `@keyframes ${keyframeName} {
      from {
        ${Object.entries(from || {})
          .map(([key, value]) => `${this.camelToKebab(key)}: ${value};`)
          .join(" ")}
      }
      to {
        ${Object.entries(to || {})
          .map(([key, value]) => `${this.camelToKebab(key)}: ${value};`)
          .join(" ")}
      }
    }`;

    console.log("Creating keyframe:" + keyframeName);
    console.log("Keyframe CSS:" + keyframeCSS);

    // Remove the previous keyframe if it exists
    if (this.currentKeyframeName) {
      this.removeKeyframes(this.currentKeyframeName);
    }

    // Append the new keyframe to the style element's content
    this.styleElement.textContent = keyframeCSS;
    this.currentKeyframeName = keyframeName;

    console.log("Keyframe " + keyframeName + "appended to <style> element");
    console.log("Current <style> content: " + this.styleElement.textContent);

    return keyframeName;
  }

  private removeKeyframes(keyframeName: string) {
    console.log("Removing keyframe: " + keyframeName);
    this.styleElement.textContent = "";
    console.log("Keyframe" + keyframeName + "removed");
    console.log("Current <style> content after removal:" + this.styleElement.textContent);
    this.currentKeyframeName = null;
  }

  private interceptClicks() {
    console.log("started -> interceptClicks() Method");

    document.addEventListener("click", (event) => {
      const target = event.target as HTMLElement;
      const anchor = target.closest("a");
      if (anchor && this.shouldIntercept(anchor)) {
        event.preventDefault();
        this.navigate(anchor.href);
      }
    });
  }

  private shouldIntercept(anchor: HTMLAnchorElement): boolean {
    console.log("started -> shouldIntercept() Method");

    const isSameOrigin = anchor.origin === window.location.origin;
    const isNotHash = anchor.hash === "";
    return isSameOrigin && isNotHash;
  }

  private handlePopState() {
    console.log("started -> handlePopState() Method");

    window.addEventListener("popstate", () => {
      this.navigate(window.location.href, false);
    });
  }

  public async navigate(url: string, pushState: boolean = true) {
    console.log("started -> navigate() Method");

    try {
      const content = await this.fetchPage(url);
      if (content) {
        if (pushState) {
          history.pushState(null, "", url);
        }
        this.updatePage(content);
      }
    } catch (error) {
      console.error("Navigation failed:", error);
    }
  }
  private async fetchPage(url: string): Promise<string> {
    console.log("started -> fetchPage() Method");

    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.text();
  }

  private updatePage(content: string) {
    console.log("started -> updatePage() Method");

    const parser = new DOMParser();
    const newDoc = parser.parseFromString(content, "text/html");

    this.updateHead(newDoc);
    this.updateBody(newDoc);
  }

  private updateHead(newDoc: Document) {
    console.log("started -> updateHead() Method");

    const oldHead = document.head;
    const newHead = newDoc.head;

    // Always update the title
    document.title = newDoc.title;

    // If updateHead is false, don't update anything else in the head
    if (this.options.updateHead === false) {
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
        oldHead.appendChild(child.cloneNode(true));
      }
    });

    console.log("Head updated, xref style element preserved");
  }

  private updateBody(newDoc: Document) {
    console.log("started -> updateBody() Method");

    const swapHtml = this.options.swapHtml || "body";
    const oldElement = document.querySelector(swapHtml);
    const newElement = newDoc.querySelector(swapHtml);

    if (!oldElement) {
      console.error(`Old document does not contain element: ${swapHtml}`);
      return;
    }

    if (!newElement) {
      console.error(`New document does not contain element: ${swapHtml}`);
      return;
    }

    // Type assertions
    this.performTransition(oldElement as HTMLElement, newElement as HTMLElement);
    /* this.removeInlineStylesFromRoot(); */
  }

  private performTransition(oldBody: HTMLElement, newBody: HTMLElement) {
    console.log("Started performTransition");
    const transitionOptions = this.options.transition || {};
    const duration = transitionOptions.duration || 300;
    const delay = transitionOptions.delay || 0;
    const easing = transitionOptions.easing || "ease-in-out";
    const timeline = transitionOptions.timeline || "sequential";

    let outTransition = transitionOptions.out;
    let inTransition = transitionOptions.in;

    // If no out transition is set, reverse the in transition
    if (!outTransition && inTransition) {
      outTransition = this.reverseTransition(inTransition);
    }
    // If no in transition is set, reverse the out transition
    else if (!inTransition && outTransition) {
      inTransition = this.reverseTransition(outTransition);
    }

    console.log("Transition options:", { duration, delay, easing, timeline });
    console.log("Out transition:", outTransition);
    console.log("In transition:", inTransition);

    if (outTransition) {
      console.log("Applying out transition");
      this.applyTransition(oldBody, outTransition, duration, delay, easing, "out");
    }

    const applyInTransition = () => {
      console.log("Applying in transition");
      // Remove the "out" animation
      oldBody.style.removeProperty("animation");

      oldBody.innerHTML = newBody.innerHTML;
      Array.from(newBody.attributes).forEach((attr) => {
        if (attr.name !== "style") {
          oldBody.setAttribute(attr.name, attr.value);
        }
      });

      if (inTransition) {
        this.applyTransition(oldBody, inTransition, duration, 0, easing, "in");
      }
    };

    if (timeline === "sequential") {
      console.log(`Setting timeout for in transition: ${duration + delay}ms`);
      setTimeout(applyInTransition, duration / 2 + delay);
    } else {
      console.log(`Setting timeout for in transition: ${delay}ms (parallel)`);
      setTimeout(applyInTransition, delay);
    }
  }

  private reverseTransition(transition: TransitionState): TransitionState {
    return {
      from: transition.to,
      to: transition.from,
    };
  }

  private applyTransition(element: HTMLElement, transitionState: TransitionState, duration: number, delay: number, easing: string, direction: "in" | "out") {
    console.log(`Applying ${direction} transition`);
    const keyframeName = this.createKeyframes(transitionState, direction);
    const animationCSS = `${keyframeName} ${duration}ms ${easing} ${delay}ms forwards`;

    // Ensure we're setting the animation property correctly
    element.style.setProperty("animation", animationCSS);
    console.log(`Applied ${direction} animation: ${animationCSS}`);
    console.log(`Current element style:`, element.style.cssText);

    // Force a reflow to ensure the animation is applied immediately
    void element.offsetWidth;

    const cleanup = () => {
      console.log(`Animation end event fired for ${direction} transition`);
      element.style.removeProperty("animation");

      // Remove the keyframe immediately after the animation is complete
      this.removeKeyframes(keyframeName);

      if (direction === "in") {
        Object.entries(transitionState.to || {}).forEach(([key, value]) => {
          element.style.setProperty(this.camelToKebab(key), value as string);
        });
      }
      console.log(`Cleaned up ${direction} animation`);
      console.log(`Current element style after cleanup:`, element.style.cssText);
      element.removeEventListener("animationend", cleanup);
    };

    element.addEventListener("animationend", cleanup, { once: true });
  }

  public camelToKebab(str: string): string {
    return str.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
  }
}

function xref(options: XrefOptions = {}): Xref {
  return new Xref(options);
}

export default xref;
