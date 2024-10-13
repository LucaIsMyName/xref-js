import { XrefOptions } from "./xref";

interface PrefetchOptions {
  event?: string;
  delay?: number;
  selector?: string;
  active?: boolean;
}

export class Prefetcher {
  private cache: Map<string, string> = new Map();
  private options: PrefetchOptions;
  private xrefOptions: XrefOptions;

  /**
   *
   * @description Initializes the prefetcher
   * with the given options.
   */
  constructor(options: PrefetchOptions, xrefOptions: XrefOptions) {
    this.options = options;
    this.xrefOptions = xrefOptions;
    this.init();
  }

  /**
   * @description Initializes the prefetcher by
   * adding an event listener to the document.
   */
  private init() {
    if (!this.options.active) return;
    document.addEventListener(this.options.event || "mouseover", this.handleEvent.bind(this));
  }

  /**
   *
   * @description Handles the event by checking if the target
   * is an anchor element and if it should be prefetched.
   */
  private handleEvent(event: Event) {
    const target = event.target as HTMLElement;
    const link = target.closest(this.options.selector || "a") as HTMLAnchorElement | null;

    if (link && this.shouldPrefetch(link)) {
      setTimeout(() => this.prefetch(link.href), this.options.delay || 100);
    }
  }

  /**
   *
   * @description Checks if the link should be prefetched.
   * It should be prefetched if it's an anchor element, it's
   * not the current page, and it's not already in the cache.
   */
  private shouldPrefetch(link: HTMLAnchorElement): boolean {
    return !!(link.href && link.href.startsWith(window.location.origin) && link.href !== window.location.href && !this.cache.has(link.href));
  }

  /**
   *
   * @description Fetches the content of the given URL
   * and stores it in the cache. If the fetch fails, it logs
   * an error to the console.
   */
  private async prefetch(url: string) {
    try {
      const response = await fetch(url);
      const text = await response.text();
      this.cache.set(url, text);
      this.xrefOptions.debug ? console.log(`Prefetched: ${url}`) : null;
    } catch (error) {
      this.xrefOptions.debug ? console.error("Failed to prefetch:" + url, error) : null;
    }
  }

  /**
   *
   * @description Gets the content of the given URL
   * from the cache. If the content is not in the cache,
   * it returns null. Otherwise, it returns the content.
   * This method is used by the Xref instance to get the
   * content of a URL before navigating to it.
   */
  public getContent(url: string): string | null {
    return this.cache.get(url) || null;
  }
}

export function initPrefetcher(options: PrefetchOptions, xrefOptions: XrefOptions): Prefetcher {
  return new Prefetcher(options, xrefOptions);
}
