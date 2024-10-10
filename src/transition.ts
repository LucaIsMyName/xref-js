import { XrefOptions, TransitionDirection } from './xref';

export function setupViewTransitions(options: XrefOptions): void {
  console.log('Setting up view transitions');
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const link = target.closest('a');
    if (link && isInternalLink(link)) {
      console.log('Internal link clicked:', link.href);
      e.preventDefault();
      const xref = (window as any).xref;
      if (typeof xref?.navigateTo === 'function') {
        xref.navigateTo(link.href);
      } else {
        console.warn('xref.navigateTo is not a function');
      }
    }
  });
}

function isInternalLink(link: HTMLAnchorElement): boolean {
  return link.href.startsWith(window.location.origin);
}

export function animate(selector: string | NodeListOf<Element>, options: NonNullable<XrefOptions['transition']>): void {
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

function createTransitionStyles(elements: NodeListOf<Element>, options: Required<XrefOptions>['transition']): string {
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

function createKeyframes(transition: TransitionDirection | undefined, type: 'in' | 'out'): { name: string; rules: string } {
  const name = `xref-${type}-${Math.random().toString(36).substr(2, 9)}`;
  const fromStyles = transition?.from ? objectToCSSString(transition.from) : '';
  const toStyles = transition?.to ? objectToCSSString(transition.to) : '';

  const rules = `
    from { ${fromStyles} }
    to { ${toStyles} }
  `;

  return { name, rules };
}

function objectToCSSString(obj: Record<string, string | number>): string {
  return Object.entries(obj)
    .map(([key, value]) => `${camelToKebabCase(key)}: ${value};`)
    .join(' ');
}

function camelToKebabCase(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

function applyStyles(styles: string): void {
  removeStyles();
  const styleElement = document.createElement('style');
  styleElement.textContent = styles;
  document.head.appendChild(styleElement);
}

function removeStyles(): void {
  const styleElement = document.querySelector('style[data-xref]');
  if (styleElement) {
    styleElement.remove();
  }
}