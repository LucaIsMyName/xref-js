import xref from "../xref";

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

describe("xref", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = `
      <div id="content">
        <a href="/page1">Page 1</a>
        <a href="/page2">Page 2</a>
      </div>
    `;
  });

  test("intercepts clicks on internal links", () => {
    const instance = xref();
    const link = document.querySelector('a[href="/page1"]') as HTMLAnchorElement;
    link.click();

    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/page1'));
  });

  test("does not intercept clicks on external links", () => {
    const instance = xref();
    const externalLink = document.createElement('a');
    externalLink.href = 'https://example.com';
    document.body.appendChild(externalLink);

    externalLink.click();

    expect(mockFetch).not.toHaveBeenCalled();
  });

  test("updates content after navigation", async () => {
    const instance = xref();
    await instance.navigate('/page1');

    expect(document.querySelector('#content')?.innerHTML).toContain('<h1>New Page Content</h1>');
  });

  test("updates browser history", async () => {
    const instance = xref();
    await instance.navigate('/page1');

    expect(mockPushState).toHaveBeenCalledWith(null, '', expect.stringContaining('/page1'));
  });

  test("does not update head when updateHead is false, except for title", async () => {
    document.head.innerHTML = `
      <title>Original Title</title>
      <meta name="description" content="Original description">
    `;

    const instance = xref({
      updateHead: false,
      swapHtml: "#content",
    });

    mockFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        text: () =>
          Promise.resolve(`
          <html>
            <head>
              <title>New Title</title>
              <meta name="description" content="New description">
            </head>
            <body>
              <div id="content"><h1>New Page Content</h1></div>
            </body>
          </html>
        `),
      } as Response)
    );

    await instance.navigate("/page1");

    expect(document.title).toBe("New Title");
    expect(document.querySelector('meta[name="description"]')?.getAttribute("content")).toBe("Original description");
  });

  test("updates head when updateHead is true", async () => {
    document.head.innerHTML = `
      <title>Original Title</title>
      <meta name="description" content="Original description">
    `;

    const instance = xref({
      updateHead: true,
      swapHtml: "#content",
    });

    mockFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        text: () =>
          Promise.resolve(`
          <html>
            <head>
              <title>New Title</title>
              <meta name="description" content="New description">
            </head>
            <body>
              <div id="content"><h1>New Page Content</h1></div>
            </body>
          </html>
        `),
      } as Response)
    );

    await instance.navigate("/page1");

    expect(document.title).toBe("New Title");
    expect(document.querySelector('meta[name="description"]')?.getAttribute("content")).toBe("New description");
  });
});