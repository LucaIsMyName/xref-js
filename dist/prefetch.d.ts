interface PrefetchOptions {
    isActive: boolean;
    event: string;
    delay: number;
}
export declare function setupPrefetching(options: PrefetchOptions): void;
export {};
