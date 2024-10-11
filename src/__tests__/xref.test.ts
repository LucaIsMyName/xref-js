import xref from '../xref';

// Mock fetch
const mockFetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    text: () => Promise.resolve('<div id="content"><h1>New Page Content</h1></div>'),
  } as Response)
);

window.fetch = mockFetch;

// Mock pushState
const mockPushState = jest.fn();
window.history.pushState = mockPushState;

describe('xref', () => {
 test('', async () => {
    // Arrange
    document.body.innerHTML = `
      <a href="/new-page">New Page</a>
      <div id="content"><h1>Initial Page Content</h1></div>
    `;
  
    // Act
    xref();
  
    // Simulate click
    document.querySelector('a')?.click();
    await Promise.resolve();
  
    // Assert
    expect(mockPushState).toHaveBeenCalledWith(null, '', '/new-page');
    expect(document.body.innerHTML).toContain('<h1>New Page Content</h1>');
  });
});