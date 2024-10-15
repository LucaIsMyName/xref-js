import { XrefOptions, TransitionOptions, TransitionState, PartialTransition } from "./xref";
import { camelToKebab } from "./utils";

export async function handlePartials(partials: PartialTransition[], oldElement: HTMLElement, newElement: HTMLElement, options: XrefOptions, direction: "in" | "out") {
  options.debug ? console.log(`Handling partials for ${direction} transition`) : null;

  const partialPromises = partials.flatMap((partial, index) => {
    const elements = oldElement.querySelectorAll(partial.element);
    options.debug ? console.log(`Found ${elements.length} elements matching selector: ${partial.element}`) : null;

    return Array.from(elements).map((element) => {
      const mergedOptions = mergeOptions(partial, options.transition, index);

      if (direction === "out" && partial.out) {
        return applyPartialTransition(element as HTMLElement, partial.out, mergedOptions, "out");
      } else if (direction === "in" && partial.in) {
        // remove visibility:;hidden in inline styles
        element.style.removeProperty("visibility");

        return applyPartialTransition(element as HTMLElement, partial.in, mergedOptions, "in");
      }
      return Promise.resolve();
    });
  });

  await Promise.all(partialPromises);
}

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

export function hidePartials(partials: PartialTransition[], element: HTMLElement) {
  partials.forEach((partial) => {
    const elements = element.querySelectorAll(partial.element);
    elements.forEach((el: HTMLElement | any) => {
      el.style.visibility = "hidden";
    });
  });
}

export function showPartials(partials: PartialTransition[], element: HTMLElement) {
  partials.forEach((partial) => {
    const elements = element.querySelectorAll(partial.element);
    elements.forEach((el: HTMLElement | any) => {
      el.style.visibility = "visible";
    });
  });
}

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
  const keyframeName = `xref-partial-${direction}-${Math.random().toString(36).substr(2, 9)}`;

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
  document.head.appendChild(styleElement);

  return keyframeName;
}

function removeKeyframes(keyframeName: string) {
  const styleElement = document.querySelector(`style:not([data-xref="true"]):last-of-type`);
  if (styleElement) {
    styleElement.remove();
  }
}
