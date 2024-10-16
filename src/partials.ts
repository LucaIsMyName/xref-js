import { XrefOptions, TransitionOptions, TransitionState, PartialTransition } from "./xref";
import { camelToKebab } from "./utils";

/**
 * 
 * @description Handle partial transitions for a given element 
 */
export async function handlePartials(partials: PartialTransition[], oldElement: HTMLElement, newElement: HTMLElement, options: XrefOptions, direction: "in" | "out") {
  options.debug ? console.log(`Handling partials for ${direction} transition`) : null;

  const partialPromises = partials.flatMap((partial, index) => {
    const elements = oldElement.querySelectorAll(partial.element);
    options.debug ? console.log(`Found ${elements.length} elements matching selector: ${partial.element}`) : null;

    return Array.from(elements).map((element: any) => {
      const mergedOptions = mergeOptions(partial, options.transition, index);
      let transitionState = direction === "out" ? partial.out : partial.in;

      // If the transition for the current direction is not defined, reverse the other direction
      if (!transitionState) {
        const oppositeTransition = direction === "out" ? partial.in : partial.out;
        if (oppositeTransition) {
          transitionState = reverseTransition(oppositeTransition);
        }
      }

      if (transitionState) {
        if (direction === "in") {
          element.style.removeProperty("visibility");
        }
        return applyPartialTransition(element as HTMLElement, transitionState, mergedOptions, direction);
      }
      return Promise.resolve();
    });
  });

  await Promise.all(partialPromises);
}

/**
 * 
 * @description Merge partial transition options with global transition options
 */
function mergeOptions(partial: PartialTransition, globalTransition: TransitionOptions | undefined, index: number): TransitionOptions {
  const globalPartial = globalTransition?.partials?.[index] || {};
  return {
    ...globalTransition,
    ...globalPartial,
    duration: partial.duration ?? globalTransition?.duration,
    delay: partial.delay ?? globalTransition?.delay,
    easing: partial.easing ?? globalTransition?.easing,
  };
}

/**
 * 
 * @description Reverse the transition state
 */
function reverseTransition(transition: TransitionState): TransitionState {
  return {
    from: transition.to,
    to: transition.from,
  };
}

/**
 * 
 * @description Hide partial elements
 */
export function hidePartials(partials: PartialTransition[], element: HTMLElement) {
  partials.forEach((partial) => {
    const elements = element.querySelectorAll(partial.element);
    elements.forEach((el: HTMLElement | any) => {
      el.style.visibility = "hidden";
    });
  });
}

/**
 * 
 * @description Show partial elements
 */
export function showPartials(partials: PartialTransition[], element: HTMLElement) {
  partials.forEach((partial) => {
    const elements = element.querySelectorAll(partial.element);
    elements.forEach((el: HTMLElement | any) => {
      el.style.visibility = "visible";
    });
  });
}

/**
 * @description Apply partial transition to an element
 * */
async function applyPartialTransition(element: HTMLElement, transitionState: TransitionState, options: TransitionOptions, direction: "in" | "out"): Promise<void> {
  return new Promise((resolve) => {
    const duration = options.duration || 300;
    const delay = options.delay ?? 0;
    const easing = options.easing || "ease-in-out";

    const keyframeName = createKeyframes(transitionState, direction);
    const animationCSS = `${keyframeName} ${duration}ms ${easing} ${delay}ms forwards`;

    element.style.setProperty("animation", animationCSS);
    console.log(`Applied ${direction} animation to partial: ${animationCSS}`);
    console.log("Current partial element style:", element.style.cssText);

    // Force a reflow to ensure the animation is applied immediately
    void element.offsetWidth;

    const cleanup = () => {
      console.log(`Animation end event fired for ${direction} transition on partial: ${element.tagName}`);
      element.style.removeProperty("animation");

      // Remove the keyframe immediately after the animation is complete
      removeKeyframes(keyframeName);

      if (direction === "in") {
        Object.entries(transitionState.to || {}).forEach(([key, value]) => {
          element.style.setProperty(camelToKebab(key), value as string);
        });
      }
      console.log(`Cleaned up ${direction} animation for partial: ${element.tagName}`);
      console.log("Current partial element style after cleanup:", element.style.cssText);

      resolve();
    };

    element.addEventListener("animationend", cleanup, { once: true });
  });
}

function createKeyframes(transitionState: TransitionState, direction: "in" | "out"): string {
  const { from, to } = transitionState;
  let randomId = Math.random().toString(36).substr(2, 9);
  const keyframeName = `xref-partial-${direction}-${randomId}`;

  const keyframeCSS = `@keyframes ${keyframeName} {
    from {
      ${Object.entries(from || {})
        .map(([key, value]) => `${camelToKebab(key)}: ${value};`)
        .join(" ")}
    }
    to {
      ${Object.entries(to || {})
        .map(([key, value]) => `${camelToKebab(key)}: ${value};`)
        .join(" ")}
    }
  }`;

  const styleElement = document.createElement("style");
  styleElement.textContent = keyframeCSS;
  styleElement.setAttribute(keyframeName, '');
  document.head.appendChild(styleElement);

  return keyframeName;
}

function removeKeyframes(keyframeName: string) {
  // this is bad implementation, remove by keyframeName not :last-of-type selector
  // const styleElement = document.querySelector(`style:not([data-xref="true"]):last-of-type`);

  const styleElement = document.querySelector(`style[${keyframeName}]`);
  if (styleElement) {
    styleElement.remove();
  }
}
