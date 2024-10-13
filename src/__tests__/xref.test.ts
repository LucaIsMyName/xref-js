import { jest } from '@jest/globals';
import xref from "../xref";
import { Prefetcher, initPrefetcher } from "../prefetch";


// Mock fetch
const mockFetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    text: () => Promise.resolve('<div id="content"><h1>New Page Content</h1></div>'),
  } as Response)
);

global.fetch = mockFetch as any;

// Mock pushState
const mockPushState = jest.fn();
global.history.pushState = mockPushState;

// Mock Prefetcher
jest.mock("../prefetch", () => {
  return {
    Prefetcher: jest.fn().mockImplementation(() => ({
      getContent: jest.fn(),
    })),
    initPrefetcher: jest.fn().mockImplementation(() => ({
      getContent: jest.fn(),
    })),
  };
});

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

    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("/page1"));
  });

  test("does not intercept clicks on external links", () => {
    const instance = xref();
    const externalLink = document.createElement("a");
    externalLink.href = "https://example.com";
    document.body.appendChild(externalLink);

    externalLink.click();

    expect(mockFetch).not.toHaveBeenCalled();
  });

  test("updates content after navigation", async () => {
    const instance = xref();
    await instance.navigate("/page1");

    expect(document.querySelector("#content")?.innerHTML).toContain("<h1>New Page Content</h1>");
  });

  test("updates browser history", async () => {
    const instance = xref();
    await instance.navigate("/page1");

    expect(mockPushState).toHaveBeenCalledWith(null, "", expect.stringContaining("/page1"));
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

  test("prefetches content when prefetch option is set", async () => {
    const prefetchedContent = '<div id="content"><h1>Prefetched Content</h1></div>';
    const mockGetContent = jest.fn().mockReturnValue(prefetchedContent);
    (initPrefetcher as jest.Mock).mockImplementation(() => ({
      getContent: mockGetContent,
    }));

    const instance = xref({
      prefetch: {
        event: "mouseover",
        delay: 100,
      },
    });

    await instance.navigate("/prefetched");

    expect(mockGetContent).toHaveBeenCalledWith("/prefetched");
    expect(document.querySelector("#content")?.innerHTML).toContain("<h1>Prefetched Content</h1>");
  });

  test("uses fetched content when prefetch returns null", async () => {
    const mockGetContent = jest.fn().mockReturnValue(null);
    (initPrefetcher as jest.Mock).mockImplementation(() => ({
      getContent: mockGetContent,
    }));

    const instance = xref({
      prefetch: {
        event: "mouseover",
        delay: 100,
      },
    });

    await instance.navigate("/not-prefetched");

    expect(mockGetContent).toHaveBeenCalledWith("/not-prefetched");
    expect(mockFetch).toHaveBeenCalledWith("/not-prefetched");
    expect(document.querySelector("#content")?.innerHTML).toContain("<h1>New Page Content</h1>");
  });

  test("handles navigation errors", async () => {

    mockFetch.mockImplementationOnce(() => Promise.reject(new Error("Network error")));
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    const instance = xref();
    await instance.navigate("/error-page");

    expect(consoleSpy).toHaveBeenCalledWith("Navigation failed:", expect.any(Error));
    consoleSpy.mockRestore();
  });
});