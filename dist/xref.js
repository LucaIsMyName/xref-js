(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.xref = factory());
})(this, (function () { 'use strict';

  function setupViewTransitions(options) {
      document.addEventListener('click', (e) => {
          const target = e.target;
          const link = target.closest('a');
          if (link && isInternalLink$1(link)) {
              e.preventDefault();
              const xref = window.xref;
              if (typeof (xref === null || xref === void 0 ? void 0 : xref.navigateTo) === 'function') {
                  xref.navigateTo(link.href);
              }
          }
      });
  }
  function isInternalLink$1(link) {
      return link.href.startsWith(window.location.origin);
  }
  function animate(selector, options) {
      const elements = typeof selector === 'string' ? document.querySelectorAll(selector) : selector;
      const { duration, delay, easing, in: inTransition, out: outTransition, timeline = 'sequential' } = options;
      const styles = createTransitionStyles(elements, { duration, delay, easing, in: inTransition, out: outTransition, timeline });
      applyStyles(styles);
      document.addEventListener('startViewTransition', () => {
          applyStyles(styles);
      });
      document.addEventListener('finishViewTransition', () => {
          removeStyles();
      });
  }
  function createTransitionStyles(elements, options) {
      const { duration, delay, easing, in: inTransition, out: outTransition } = options;
      let styles = '';
      elements.forEach((element, index) => {
          const elementId = `xref-animated-${index}`;
          element.id = elementId;
          const inKeyframes = createKeyframes(inTransition, 'in');
          const outKeyframes = createKeyframes(outTransition, 'out');
          styles += `
      @keyframes ${inKeyframes.name} {
        ${inKeyframes.rules}
      }
      @keyframes ${outKeyframes.name} {
        ${outKeyframes.rules}
      }
      #${elementId} {
        animation: ${duration}ms ${delay}ms ${easing} both var(--xref-animation-name, none);
      }
      #${elementId}::view-transition-new {
        animation: ${duration}ms ${delay}ms ${easing} both ${inKeyframes.name};
      }
      #${elementId}::view-transition-old {
        animation: ${duration}ms ${delay}ms ${easing} both ${outKeyframes.name};
      }
    `;
      });
      return styles;
  }
  function createKeyframes(transition, type) {
      const name = `xref-${type}-${Math.random().toString(36).substr(2, 9)}`;
      const fromStyles = (transition === null || transition === void 0 ? void 0 : transition.from) ? objectToCSSString(transition.from) : '';
      const toStyles = (transition === null || transition === void 0 ? void 0 : transition.to) ? objectToCSSString(transition.to) : '';
      const rules = `
    from { ${fromStyles} }
    to { ${toStyles} }
  `;
      return { name, rules };
  }
  function objectToCSSString(obj) {
      return Object.entries(obj)
          .map(([key, value]) => `${camelToKebabCase(key)}: ${value};`)
          .join(' ');
  }
  function camelToKebabCase(str) {
      return str.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
  }
  function applyStyles(styles) {
      removeStyles();
      const styleElement = document.createElement('style');
      styleElement.textContent = styles;
      document.head.appendChild(styleElement);
  }
  function removeStyles() {
      const styleElement = document.querySelector('style[data-xref]');
      if (styleElement) {
          styleElement.remove();
      }
  }

  function setupPrefetching(options) {
      document.addEventListener(options.event, (e) => {
          const target = e.target;
          const link = target.closest('a');
          if (link && isInternalLink(link)) {
              setTimeout(() => prefetchPage(link.href), options.delay);
          }
      });
  }
  function isInternalLink(link) {
      return link.href.startsWith(window.location.origin);
  }
  async function prefetchPage(url) {
      try {
          const response = await fetch(url, { method: 'GET' });
          const text = await response.text();
          const parser = new DOMParser();
          parser.parseFromString(text, 'text/html');
          console.log(`Prefetched: ${url}`);
      }
      catch (error) {
          console.error(`Failed to prefetch ${url}:`, error);
      }
  }

  const defaultOptions = {
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
  function xref(options = {}) {
      var _a;
      if (!xref.isSupported) {
          console.warn("View Transitions API is not supported in this browser. Xref will not apply transitions.");
          return;
      }
      const mergedOptions = Object.assign(Object.assign({}, xref.defaultOptions), options);
      setupViewTransitions();
      if ((_a = mergedOptions.prefetch) === null || _a === void 0 ? void 0 : _a.isActive) {
          setupPrefetching(mergedOptions.prefetch);
      }
      handleBrowserNavigation();
  }
  function handleBrowserNavigation() {
      window.addEventListener('popstate', () => {
          const url = window.location.href;
          xref.navigateTo(url, true);
      });
  }
  xref.navigateTo = (url, isBackForward = false) => {
      if (!isBackForward) {
          history.pushState(null, '', url);
      }
      const startViewTransition = document.startViewTransition;
      if (typeof startViewTransition === 'function') {
          startViewTransition(() => {
              return fetch(url)
                  .then(response => response.text())
                  .then(html => {
                  const parser = new DOMParser();
                  const newDocument = parser.parseFromString(html, 'text/html');
                  // Update the <head> content
                  document.head.innerHTML = newDocument.head.innerHTML;
                  // Update the <body> or specified element content
                  const targetElement = document.querySelector(xref.defaultOptions.swapHtml || 'body');
                  const sourceElement = newDocument.querySelector(xref.defaultOptions.swapHtml || 'body');
                  if (targetElement && sourceElement) {
                      targetElement.innerHTML = sourceElement.innerHTML;
                  }
                  window.scrollTo(0, 0);
              });
          });
      }
      else {
          // Fallback for browsers that don't support View Transitions
          window.location.href = url;
      }
  };
  xref.version = '0.0.1'; // Update this with your current version
  xref.defaultOptions = defaultOptions;
  xref.isSupported = typeof document !== 'undefined' && 'startViewTransition' in document;
  xref.animate = animate;

  return xref;

}));
