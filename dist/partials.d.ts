import { XrefOptions, PartialTransition } from "./xref";
export declare function handlePartials(partials: PartialTransition[], oldElement: HTMLElement, newElement: HTMLElement, options: XrefOptions, direction: "in" | "out"): Promise<void>;
export declare function hidePartials(partials: PartialTransition[], element: HTMLElement): void;
export declare function showPartials(partials: PartialTransition[], element: HTMLElement): void;
