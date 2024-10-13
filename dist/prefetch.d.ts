import { XrefOptions } from "./xref";
interface PrefetchOptions {
    event?: string;
    delay?: number;
    selector?: string;
    active?: boolean;
}
export declare class Prefetcher {
    private cache;
    private options;
    private xrefOptions;
    /**
     *
     * @description Initializes the prefetcher
     * with the given options.
     */
    constructor(options: PrefetchOptions, xrefOptions: XrefOptions);
    /**
     * @description Initializes the prefetcher by
     * adding an event listener to the document.
     */
    private init;
    /**
     *
     * @description Handles the event by checking if the target
     * is an anchor element and if it should be prefetched.
     */
    private handleEvent;
    /**
     *
     * @description Checks if the link should be prefetched.
     * It should be prefetched if it's an anchor element, it's
     * not the current page, and it's not already in the cache.
     */
    private shouldPrefetch;
    /**
     *
     * @description Fetches the content of the given URL
     * and stores it in the cache. If the fetch fails, it logs
     * an error to the console.
     */
    private prefetch;
    /**
     *
     * @description Gets the content of the given URL
     * from the cache. If the content is not in the cache,
     * it returns null. Otherwise, it returns the content.
     * This method is used by the Xref instance to get the
     * content of a URL before navigating to it.
     */
    getContent(url: string): string | null;
}
export declare function initPrefetcher(options: PrefetchOptions, xrefOptions: XrefOptions): Prefetcher;
export {};
