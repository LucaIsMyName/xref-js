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
  private tailwindStyleElement: HTMLStyleElement | null = null;

  constructor(options: XrefOptions = {}) {
    this.options = {
      updateHead: true,  // Default value
      ...options
    };
    this.init();
  }

  private init() {
    this.interceptClicks();
    this.handlePopState();
    this.initTailwindStyle();
  }

  private removeInlineStylesFromRoot() {
    /**
     * remove the transitioned nline styles from the swapHtml element
     */

    const swapHtml = this.options.swapHtml || "body";
    const rootElement = document.querySelector(swapHtml);
    if (!rootElement) {
      return;
    }

    rootElement.removeAttribute("style");
  }

  private initTailwindStyle() {
    this.tailwindStyleElement = document.querySelector("style[data-tailwind]");
    if (!this.tailwindStyleElement) {
      this.tailwindStyleElement = document.createElement("style");
      this.tailwindStyleElement.setAttribute("data-tailwind", "true");
      document.head.appendChild(this.tailwindStyleElement);
    }
  }

  private interceptClicks() {
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
    const isSameOrigin = anchor.origin === window.location.origin;
    const isNotHash = anchor.hash === "";
    return isSameOrigin && isNotHash;
  }

  private handlePopState() {
    window.addEventListener("popstate", () => {
      this.navigate(window.location.href, false);
    });
  }

  public async navigate(url: string, pushState: boolean = true) {
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
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.text();
  }

  private updatePage(content: string) {
    const parser = new DOMParser();
    const newDoc = parser.parseFromString(content, "text/html");

    this.updateHead(newDoc);
    this.updateBody(newDoc);
  }

  private updateHead(newDoc: Document) {
    const oldHead = document.head;
    const newHead = newDoc.head;

    // Always update the title
    document.title = newDoc.title;

    // If updateHead is false, don't update anything else in the head
    if (this.options.updateHead === false) {
      return;
    }

    // Update Tailwind styles
    const newTailwindStyle = newDoc.querySelector("style[data-tailwind]");
    if (newTailwindStyle && this.tailwindStyleElement) {
      this.tailwindStyleElement.textContent = newTailwindStyle.textContent;
    }

    // update all scripts!

    const allScripts = Array.from(document.querySelectorAll("script"));
    const newScripts = Array.from(newDoc.querySelectorAll("script"));

    allScripts.forEach((script) => {
      script.remove();
    });

    newScripts.forEach((script) => {
      document.body.appendChild(script.cloneNode(true));
    });


    // Remove old elements except Tailwind style
    Array.from(oldHead.children).forEach((child) => {
      if (child !== this.tailwindStyleElement && child.tagName !== 'TITLE') {
        child.remove();
      }
    });

    // Add new elements
    Array.from(newHead.children).forEach((child) => {
      if (child.tagName !== "STYLE" || !child.getAttribute("data-tailwind")) {
        if (child.tagName !== 'TITLE') {
          oldHead.appendChild(child.cloneNode(true));
        }
      }
    });
  }

  private updateBody(newDoc: Document) {
    const oldBody = document.body;
    const newBody = newDoc.body;

    if (!newBody) {
      console.error("New document does not contain a body tag");
      return;
    }

    this.performTransition(oldBody, newBody);
  }

  private performTransition(oldBody: HTMLElement, newBody: HTMLElement) {
    const transitionOptions = this.options.transition || {};
    const duration = transitionOptions.duration || 300;
    const delay = transitionOptions.delay || 0;
    const easing = transitionOptions.easing || "ease";

    // Apply 'out' transition
    this.applyTransition(oldBody, transitionOptions.out, duration, delay, easing, "out");

    // Apply 'in' transition
    setTimeout(
      () => {
        oldBody.innerHTML = newBody.innerHTML;
        Array.from(newBody.attributes).forEach((attr) => {
          if (attr.name !== "style") {
            oldBody.setAttribute(attr.name, attr.value);
          }
        });
        this.applyTransition(oldBody, transitionOptions.in, duration, 0, easing, "in");
      },
      transitionOptions.timeline === "sequential" ? duration + delay : delay
    );
  }

  private applyTransition(element: HTMLElement, transitionState: TransitionState | undefined, duration: number, delay: number, easing: string, direction: "in" | "out") {
    if (!transitionState) return;

    const { from, to } = transitionState;
    const transitionProperties: string[] = [];

    let styles = "";

    if (from) {
      Object.entries(from).forEach(([key, value]) => {
        const prop = this.camelToKebab(key);
        styles += `${prop}: ${value}; `;
        transitionProperties.push(prop);
      });
    }

    styles += `transition: ${transitionProperties.map((prop) => `${prop} ${duration}ms ${easing} ${delay}ms`).join(", ")};`;
    element.setAttribute("style", styles);

    if (to) {
      requestAnimationFrame(() => {
        let newStyles = "";
        Object.entries(to).forEach(([key, value]) => {
          const prop = this.camelToKebab(key);
          newStyles += `${prop}: ${value}; `;
        });
        newStyles += `transition: ${transitionProperties.map((prop) => `${prop} ${duration}ms ${easing} ${delay}ms`).join(", ")};`;
        element.setAttribute("style", newStyles);
      });
    }

    const cleanup = () => {
      // Remove the entire style attribute
      element.removeAttribute("style");
      element.removeEventListener("transitionend", cleanup);
    };

    element.addEventListener(
      "transitionend",
      () => {
        cleanup;
        document.querySelector(this.options.swapHtml || "body")?.removeAttribute("style");
      },
      { once: false }
    );
  }

  private camelToKebab(str: string): string {
    return str.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
  }
}

function xref(options: XrefOptions = {}): Xref {
  return new Xref(options);
}

export default xref;

