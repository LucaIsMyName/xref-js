import { setupViewTransitions, animate } from './transition';
import { setupPrefetching } from './prefetch';

export interface XrefOptions {
  swapHtml?: string;
  prefetch?: {
    isActive: boolean;
    event: string;
    delay: number;
  };
  transition?: {
    duration: number;
    delay: number;
    easing: string;
    timeline: 'sequential' | 'parallel';
    in?: TransitionDirection;
    out?: TransitionDirection;
  };
}

export interface TransitionDirection {
  from?: Record<string, string | number>;
  to?: Record<string, string | number>;
}

const defaultOptions: XrefOptions = {
  swapHtml: 'body',
  prefetch: {
    isActive: false,
    event: 'mouseover',
    delay: 0,
  },
  transition: {
    duration: 300,
    delay: 0,
    easing: 'ease',
    timeline: 'sequential',
  },
};

function xref(options: XrefOptions = {}): void {
  console.log('xref initialized with options:', options);
  if (!xref.isSupported) {
    console.warn("View Transitions API is not supported in this browser. Xref will not apply transitions.");
    return;
  }

  const mergedOptions = { ...xref.defaultOptions, ...options };

  setupViewTransitions(mergedOptions);
  
  if (mergedOptions.prefetch?.isActive) {
    setupPrefetching(mergedOptions.prefetch);
  }

  handleBrowserNavigation();
}

function handleBrowserNavigation(): void {
  window.addEventListener('popstate', () => {
    const url = window.location.href;
    xref.navigateTo(url, true);
  });
}

xref.navigateTo = (url: string, isBackForward: boolean = false): void => {
  console.log('navigateTo called with url:', url);
  if (!isBackForward) {
    history.pushState(null, '', url);
  }
  
  const startViewTransition = (document as any).startViewTransition;
  if (typeof startViewTransition === 'function') {
    console.log('Starting view transition');
    startViewTransition(() => {
      return fetch(url)
        .then(response => response.text())
        .then(html => {
          console.log('Fetched new page content');
          const parser = new DOMParser();
          const newDocument = parser.parseFromString(html, 'text/html');
          
          // Update the <head> content
          document.head.innerHTML = newDocument.head.innerHTML;

          // Update the <body> or specified element content
          const targetElement = document.querySelector(xref.defaultOptions.swapHtml || 'body') as HTMLElement;
          const sourceElement = newDocument.querySelector(xref.defaultOptions.swapHtml || 'body') as HTMLElement;
          
          if (targetElement && sourceElement) {
            console.log('Updating page content');
            targetElement.innerHTML = sourceElement.innerHTML;
          }

          window.scrollTo(0, 0);
        });
    });
  } else {
    console.warn('View Transitions not supported, falling back to normal navigation');
    window.location.href = url;
  }
};

xref.version = '0.0.2'; // Update this with your current version
xref.defaultOptions = defaultOptions;
xref.isSupported = typeof document !== 'undefined' && 'startViewTransition' in (document as any);
xref.animate = animate;

export default xref;