import xref from '../xref';

describe('xref', () => {
  test('xref function exists', () => {
    expect(typeof xref).toBe('function');
  });

  test('xref.version exists', () => {
    expect(typeof xref.version).toBe('string');
  });

  test('xref.defaultOptions exists', () => {
    expect(typeof xref.defaultOptions).toBe('object');
  });

  test('xref.isSupported exists', () => {
    expect(typeof xref.isSupported).toBe('boolean');
  });

  test('xref.animate function exists', () => {
    expect(typeof xref.animate).toBe('function');
  });

  test('xref.navigateTo function exists', () => {
    expect(typeof xref.navigateTo).toBe('function');
  });
});