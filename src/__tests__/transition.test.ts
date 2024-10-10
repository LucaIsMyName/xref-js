import { setupViewTransitions, animate } from '../transition';
import { XrefOptions } from '../xref';

describe('transition', () => {
  test('setupViewTransitions function exists', () => {
    expect(typeof setupViewTransitions).toBe('function');
  });

  test('animate function exists', () => {
    expect(typeof animate).toBe('function');
  });

  test('animate function handles valid input', () => {
    document.body.innerHTML = '<div id="test"></div>';
    const options: NonNullable<XrefOptions['transition']> = {
      duration: 300,
      delay: 0,
      easing: 'ease',
      timeline: 'sequential',
      in: {
        from: { opacity: 0 },
        to: { opacity: 1 },
      },
      out: {
        from: { opacity: 1 },
        to: { opacity: 0 },
      },
    };
    
    expect(() => animate('#test', options)).not.toThrow();
  });
});