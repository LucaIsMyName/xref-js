import { XrefOptions, PartialTransition } from "./xref";
/**
 *
 * @description Handle partial transitions for a given element
 */
export declare function handlePartials(partials: PartialTransition[], oldElement: HTMLElement, newElement: HTMLElement, options: XrefOptions, direction: "in" | "out"): Promise<void>;
/**
 *
 * @description Hide partial elements
 */
export declare function hidePartials(partials: PartialTransition[], element: HTMLElement): void;
/**
 *
 * @description Show partial elements
 */
export declare function showPartials(partials: PartialTransition[], element: HTMLElement): void;
