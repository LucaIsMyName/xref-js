// src/index.ts

interface PrefetchOptions {
  isActive: boolean;
  event: string;
  delay: number;
}

interface TransitionOptions {
  duration: number;
  delay: number;
  easing: string;
  timeline: "sequential" | "parallel";
  in: {
    from: Record<string, string | number>;
    to: Record<string, string | number>;
  };
  out: {
    from: Record<string, string | number>;
    to: Record<string, string | number>;
  };
}

interface XrefOptions {
  prefetch: PrefetchOptions;
  transition: TransitionOptions;
}

class Xref {
  private options: XrefOptions;
  private styleElement: HTMLStyleElement | null = null;

  constructor(options: XrefOptions) {
    this.options = options;
    this.init();
  }

  private init(): void {
    if (!document.startViewTransition) {
      console.warn("View Transitions API is not supported in this browser. Xref will not apply transitions.");
      return;
    }

    this.setupPrefetching();
    this.setupViewTransitions();
  }

  private setupPrefetching(): void {
    if (!this.options.prefetch.isActive) return;

    document.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      const link = target.closest("a");
      if (link && this.isInternalLink(link)) {
        e.preventDefault();
        setTimeout(() => this.prefetchPage(link.href), this.options.prefetch.delay);
      }
    });
  }

  private isInternalLink(link: HTMLAnchorElement): boolean {
    return link.href.startsWith(window.location.origin);
  }

  private async prefetchPage(url: string): Promise<void> {
    try {
      const response = await fetch(url, { method: "GET" });
      const text = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, "text/html");
      console.log(`Prefetched: ${url}`);
    } catch (error) {
      console.error(`Failed to prefetch ${url}:`, error);
    }
  }

  private setupViewTransitions(): void {
    document.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      const link = target.closest("a");
      if (link && this.isInternalLink(link)) {
        e.preventDefault();
        this.transitionToPage(link.href);
      }
    });
  }

  private async transitionToPage(url: string): Promise<void> {
    const transition = document.startViewTransition(async () => {
      const response = await fetch(url);
      const text = await response.text();
      document.body.innerHTML = text;
      document.documentElement.scrollTop = 0;
    });

    this.applyTransitionStyles(transition);
  }

  private applyTransitionStyles(transition: ViewTransition): void {
    const { duration, delay, easing, in: inTransition, out: outTransition } = this.options.transition;
    const styles = `
      ::view-transition-old(*) {
        animation: ${duration}ms ${delay}ms ${easing} both ${this.createKeyframes(outTransition)};
      }
      ::view-transition-new(*) {
        animation: ${duration}ms ${delay}ms ${easing} both ${this.createKeyframes(inTransition)};
      }
    `;

    this.styleElement = document.createElement("style");
    this.styleElement.textContent = styles;
    document.head.appendChild(this.styleElement);

    transition.finished.then(() => {
      if (this.styleElement) {
        this.styleElement.remove();
        this.styleElement = null;
      }
    });
  }

  private objectToCSSString(obj: Record<string, string | number>): string {
    return Object.entries(obj)
      .map(([key, value]) => `${this.camelToKebabCase(key)}: ${value};`)
      .join(" ");
  }

  private camelToKebabCase(str: string): string {
    return str.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
  }

  public animate(selector: string | NodeListOf<Element>, options: TransitionOptions): void {
    const elements = typeof selector === "string" ? document.querySelectorAll(selector) : selector;
    const { duration, delay, easing, in: inTransition, out: outTransition } = options;

    elements.forEach((element, index) => {
      const elementId = `xref-animated-${index}`;
      element.id = elementId;

      const inKeyframes = this.createKeyframes(inTransition, "in");
      const outKeyframes = this.createKeyframes(outTransition, "out");

      const styles = `
        @keyframes ${inKeyframes.name} {
          ${inKeyframes.rules}
        }
        @keyframes ${outKeyframes.name} {
          ${outKeyframes.rules}
        }
        #${elementId} {
          animation: ${duration}ms ${delay}ms ${easing} both var(--xref-animation-name);
        }
        #${elementId}::view-transition-new {
          animation: ${duration}ms ${delay}ms ${easing} both ${inKeyframes.name};
        }
        #${elementId}::view-transition-old {
          animation: ${duration}ms ${delay}ms ${easing} both ${outKeyframes.name};
        }
      `;

      const styleElement = document.createElement("style");
      styleElement.textContent = styles;
      document.head.appendChild(styleElement);

      // Set initial styles
      element.style.setProperty("--xref-animation-name", "none");

      // Apply animations when a view transition starts
      document.addEventListener("startViewTransition", () => {
        element.style.setProperty("--xref-animation-name", outKeyframes.name);
      });

      // Clean up after the transition
      document.addEventListener("finishViewTransition", () => {
        element.style.setProperty("--xref-animation-name", "none");
      });
    });
  }

  private createKeyframes(transition: { from: Record<string, string | number>; to: Record<string, string | number> }, type: "in" | "out"): { name: string; rules: string } {
    const name = `xref-${type}-${Math.random().toString(36).substr(2, 9)}`;
    const fromStyles = this.objectToCSSString(transition.from);
    const toStyles = this.objectToCSSString(transition.to);
    const rules = `
      from { ${fromStyles} }
      to { ${toStyles} }
    `;
    return { name, rules };
  }
}

export default function xref(options: XrefOptions): Xref {
  return new Xref(options);
}

xref.animate = (selector: string | NodeListOf<Element>, options: TransitionOptions): void => {
  const xrefInstance = new Xref({ prefetch: { isActive: false, event: "", delay: 0 }, transition: options });
  xrefInstance.animate(selector, options);
};
