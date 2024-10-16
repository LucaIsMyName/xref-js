import { XrefOptions } from "./xref";

interface PrefetchOptions {
  event?: string;
  delay?: number;
  selector?: string;
  active?: boolean;
  media?: boolean;
  css?: boolean;
  js?: boolean;
}

export class Prefetcher {
  private cache: Map<string, string> = new Map();
  private options: PrefetchOptions;
  private xrefOptions: XrefOptions;

  constructor(options: PrefetchOptions, xrefOptions: XrefOptions) {
    this.options = options;
    this.xrefOptions = xrefOptions;
    this.init();
  }

  private init() {
    if (!this.options.active) return;
    document.addEventListener(this.options.event || "mouseover", this.handleEvent.bind(this));
  }

  private handleEvent(event: Event) {
    const target = event.target as HTMLElement;
    const link = target.closest(this.options.selector || "a") as HTMLAnchorElement | null;

    if (link && this.shouldPrefetch(link)) {
      setTimeout(() => this.prefetch(link.href), this.options.delay || 100);
    }
  }

  private shouldPrefetch(link: HTMLAnchorElement): boolean {
    return !!(link.href && link.href.startsWith(window.location.origin) && link.href !== window.location.href && !this.cache.has(link.href));
  }

  private async prefetch(url: string) {
    try {
      const response = await fetch(url);
      const text = await response.text();
      this.cache.set(url, text);
      this.xrefOptions.debug ? console.log(`Prefetched HTML: ${url}`) : null;

      const parser = new DOMParser();
      const doc = parser.parseFromString(text, "text/html");

      if (this.options.media) {
        await this.prefetchMedia(doc);
      }
      if (this.options.css) {
        await this.prefetchCss(doc);
      }
      if (this.options.js) {
        await this.prefetchJs(doc);
      }
    } catch (error) {
      this.xrefOptions.debug ? console.error("Failed to prefetch:" + url, error) : null;
    }
  }

  private async prefetchMedia(doc: Document) {
    const mediaElements = doc.querySelectorAll("img, video, audio");
    const promises = Array.from(mediaElements).map(async (mediaElement) => {
      const mediaSrc = (mediaElement as HTMLImageElement | HTMLVideoElement | HTMLAudioElement).src;
      if (mediaSrc && !this.cache.has(mediaSrc) && !this.isCurrentlyLoaded(mediaSrc)) {
        try {
          await this.prefetchResource(mediaSrc);
        } catch (error) {
          this.xrefOptions.debug ? console.error(`Failed to prefetch media: ${mediaSrc}`, error) : null;
        }
      }
    });
    await Promise.all(promises);
  }

  private async prefetchCss(doc: Document) {
    const cssElements = doc.querySelectorAll("link[rel=stylesheet]");
    const promises = Array.from(cssElements).map(async (cssElement) => {
      const cssHref = (cssElement as HTMLLinkElement).href;
      if (cssHref && !this.cache.has(cssHref) && !this.isCurrentlyLoaded(cssHref)) {
        try {
          await this.prefetchResource(cssHref);
        } catch (error) {
          this.xrefOptions.debug ? console.error(`Failed to prefetch CSS: ${cssHref}`, error) : null;
        }
      }
    });
    await Promise.all(promises);
  }

  private async prefetchJs(doc: Document) {
    const jsElements = doc.querySelectorAll("script");
    const promises = Array.from(jsElements).map(async (jsElement) => {
      const jsSrc = (jsElement as HTMLScriptElement).src;
      if (jsSrc && !this.cache.has(jsSrc) && !this.isCurrentlyLoaded(jsSrc)) {
        try {
          await this.prefetchResource(jsSrc);
        } catch (error) {
          this.xrefOptions.debug ? console.error(`Failed to prefetch JS: ${jsSrc}`, error) : null;
        }
      }
    });
    await Promise.all(promises);
  }

  private async prefetchResource(url: string) {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      this.cache.set(url, URL.createObjectURL(blob));
      this.xrefOptions.debug ? console.log(`Prefetched resource: ${url}`) : null;
    } catch (error) {
      throw error;
    }
  }

  private isCurrentlyLoaded(url: string): boolean {
    const scripts = document.querySelectorAll("script");
    const links = document.querySelectorAll("link");
    const images = document.querySelectorAll("img");
    const audios = document.querySelectorAll("audio");
    const videos = document.querySelectorAll("video");

    return Array.from(scripts).some((script) => script.src === url) || Array.from(links).some((link) => link.href === url) || Array.from(images).some((img) => img.src === url) || Array.from(audios).some((audio) => audio.src === url) || Array.from(videos).some((video) => video.src === url);
  }

  public getContent(url: string): string | null {
    return this.cache.get(url) || null;
  }
}

export function initPrefetcher(options: PrefetchOptions, xrefOptions: XrefOptions): Prefetcher {
  return new Prefetcher(options, xrefOptions);
}
