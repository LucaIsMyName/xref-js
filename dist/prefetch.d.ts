/**
 * This file is used to prefetch data for the application.
 */
export declare function prefetch(options: {
    event: string;
    delay: number;
    active: boolean;
    callback: () => void | undefined;
}): HTMLLinkElement | undefined;
