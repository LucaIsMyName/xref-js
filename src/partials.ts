import { XrefOptions, TransitionOptions, TransitionState, PartialTransition } from "./xref";
import { camelToKebab } from "./utils";

export async function handlePartials(partials: PartialTransition[], oldElement: HTMLElement, newElement: HTMLElement, options: XrefOptions, direction: "in" | "out") {
  options.debug ? console.log(`Handling partials for ${direction} transition`) : null;

  const partialPromises = partials.flatMap((partial) => {
    const elements = oldElement.querySelectorAll(partial.element);
    options.debug ? console.log(`Found ${elements.length} elements matching selector: ${partial.element}`) : null;

    return Array.from(elements).map((element) => {
      if (direction === "out" && partial.out) {
        return applyPartialTransition(element as HTMLElement, partial.out, options, "out");
      } else if (direction === "in" && partial.in) {
        return applyPartialTransition(element as HTMLElement, partial.in, options, "in");
      }
      return Promise.resolve();
    });
  });

  await Promise.all(partialPromises);
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

async function applyPartialTransition(element: HTMLElement, transitionState: TransitionState, options: XrefOptions, direction: "in" | "out"): Promise<void> {
  return new Promise((resolve) => {
    const transitionOptions = options.transition as TransitionOptions;
    const duration = transitionOptions.duration || 300;
    const delay = transitionOptions.delay || 0;
    const easing = transitionOptions.easing || "ease-in-out";

    options.debug ? console.log(`Applying ${direction} transition to partial: ${element.tagName}`) : null;
    const keyframeName = createKeyframes(transitionState, direction);
    const animationCSS = `${keyframeName} ${duration / 2}ms ${easing} ${delay}ms forwards`;

    element.style.setProperty("animation", animationCSS);
    options.debug ? console.log(`Applied ${direction} animation to partial: ${animationCSS}`) : null;
    options.debug ? console.log("Current partial element style:", element.style.cssText) : null;

    // Force a reflow to ensure the animation is applied immediately
    void element.offsetWidth;

    const cleanup = () => {
      options.debug ? console.log(`Animation end event fired for ${direction} transition on partial: ${element.tagName}`) : null;
      element.style.removeProperty("animation");

      // Remove the keyframe immediately after the animation is complete
      removeKeyframes(keyframeName);

      if (direction === "in") {
        Object.entries(transitionState.to || {}).forEach(([key, value]) => {
          element.style.setProperty(camelToKebab(key), value as string);
        });
      }
      options.debug ? console.log(`Cleaned up ${direction} animation for partial: ${element.tagName}`) : null;
      options.debug ? console.log("Current partial element style after cleanup:", element.style.cssText) : null;

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
