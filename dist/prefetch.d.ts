import { XrefOptions } from "./xref";
interface PrefetchOptions {
    event?: string;
    delay?: number;
    selector?: string;
    active?: boolean;
    media?: boolean;
    css?: boolean;
    js?: boolean;
}
export declare class Prefetcher {
    private cache;
    private options;
    private xrefOptions;
    constructor(options: PrefetchOptions, xrefOptions: XrefOptions);
    private init;
    private handleEvent;
    private shouldPrefetch;
    private prefetch;
    private prefetchMedia;
    private prefetchCss;
    private prefetchJs;
    private prefetchResource;
    private isCurrentlyLoaded;
    getContent(url: string): string | null;
}
export declare function initPrefetcher(options: PrefetchOptions, xrefOptions: XrefOptions): Prefetcher;
export {};
