// src/prefetch.ts
interface PrefetchOptions {
  isActive: boolean;
  event: string;
  delay: number;
}

export function setupPrefetching(options: PrefetchOptions): void {
  document.addEventListener(options.event, (e) => {
    const target = e.target as HTMLElement;
    const link = target.closest('a');
    if (link && isInternalLink(link)) {
      setTimeout(() => prefetchPage(link.href), options.delay);
    }
  });
}

function isInternalLink(link: HTMLAnchorElement): boolean {
  return link.href.startsWith(window.location.origin);
}

async function prefetchPage(url: string): Promise<void> {
  try {
    const response = await fetch(url, { method: 'GET' });
    const text = await response.text();
    const parser = new DOMParser();
    parser.parseFromString(text, 'text/html');
    console.log(`Prefetched: ${url}`);
  } catch (error) {
    console.error(`Failed to prefetch ${url}:`, error);
  }
}