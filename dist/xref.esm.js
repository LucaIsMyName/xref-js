class Xref {
    constructor(options = {}) {
        this.transitionCounter = 0;
        // private currentKeyframes: { in?: string; out?: string } = {};
        this.currentKeyframeName = null;
        this.options = Object.assign({ updateHead: true }, options);
        this.styleElement = document.createElement("style");
        this.styleElement.setAttribute("data-xref", "true");
        document.head.appendChild(this.styleElement);
        this.init();
    }
    init() {
        console.log("started -> init() Method");
        this.interceptClicks();
        this.handlePopState();
    }
    createKeyframes(transitionState, direction) {
        const { from, to } = transitionState;
        const keyframeName = `xref-${direction}-${++this.transitionCounter}`;
        let keyframeCSS = `@keyframes ${keyframeName} {
      from {
        ${Object.entries(from || {})
            .map(([key, value]) => `${this.camelToKebab(key)}: ${value};`)
            .join(" ")}
      }
      to {
        ${Object.entries(to || {})
            .map(([key, value]) => `${this.camelToKebab(key)}: ${value};`)
            .join(" ")}
      }
    }`;
        console.log(`Creating keyframe: ${keyframeName}`);
        console.log(`Keyframe CSS: ${keyframeCSS}`);
        // Remove the previous keyframe if it exists
        if (this.currentKeyframeName) {
            this.removeKeyframes(this.currentKeyframeName);
        }
        // Append the new keyframe to the style element's content
        this.styleElement.textContent = keyframeCSS;
        this.currentKeyframeName = keyframeName;
        console.log(`Keyframe ${keyframeName} appended to <style> element`);
        console.log(`Current <style> content: ${this.styleElement.textContent}`);
        return keyframeName;
    }
    removeKeyframes(keyframeName) {
        console.log(`Removing keyframe: ${keyframeName}`);
        this.styleElement.textContent = '';
        console.log(`Keyframe ${keyframeName} removed`);
        console.log(`Current <style> content after removal: ${this.styleElement.textContent}`);
        this.currentKeyframeName = null;
    }
    removeUnusedKeyframes() {
        // remove all keyframes inside <style data-xref>
        console.log("started -> removeUnusedKeyframes() Method");
        const keyframeRegex = /@keyframes\s+xref-(in|out)-\d+\s*{[^}]*}/gs;
        this.styleElement.textContent = this.styleElement.textContent.replace(keyframeRegex, "");
        console.log("Removed all keyframes");
    }
    removeInlineStylesFromRoot() {
        console.log("started -> removeInlineStylesFromRoot() Method");
        /**
         * remove the transitioned nline styles from the swapHtml element
         */
        const swapHtml = this.options.swapHtml || "body";
        const rootElement = document.querySelector(swapHtml);
        if (!rootElement) {
            return;
        }
        rootElement.setAttribute("style", '');
    }
    interceptClicks() {
        console.log("started -> interceptClicks() Method");
        document.addEventListener("click", (event) => {
            const target = event.target;
            const anchor = target.closest("a");
            if (anchor && this.shouldIntercept(anchor)) {
                event.preventDefault();
                this.navigate(anchor.href);
            }
        });
    }
    shouldIntercept(anchor) {
        console.log("started -> shouldIntercept() Method");
        const isSameOrigin = anchor.origin === window.location.origin;
        const isNotHash = anchor.hash === "";
        return isSameOrigin && isNotHash;
    }
    handlePopState() {
        console.log("started -> handlePopState() Method");
        window.addEventListener("popstate", () => {
            this.navigate(window.location.href, false);
        });
    }
    async navigate(url, pushState = true) {
        console.log("started -> navigate() Method");
        try {
            const content = await this.fetchPage(url);
            if (content) {
                if (pushState) {
                    history.pushState(null, "", url);
                }
                this.updatePage(content);
            }
        }
        catch (error) {
            console.error("Navigation failed:", error);
        }
    }
    async fetchPage(url) {
        console.log("started -> fetchPage() Method");
        const response = await fetch(url);
        if (!response.ok)
            throw new Error(`HTTP error! status: ${response.status}`);
        return await response.text();
    }
    updatePage(content) {
        console.log("started -> updatePage() Method");
        const parser = new DOMParser();
        const newDoc = parser.parseFromString(content, "text/html");
        this.updateHead(newDoc);
        this.updateBody(newDoc);
    }
    updateHead(newDoc) {
        console.log("started -> updateHead() Method");
        const oldHead = document.head;
        const newHead = newDoc.head;
        // Always update the title
        document.title = newDoc.title;
        // If updateHead is false, don't update anything else in the head
        if (this.options.updateHead === false) {
            return;
        }
        // Remove old elements except our style element and title
        Array.from(oldHead.children).forEach((child) => {
            if (child !== this.styleElement && child.tagName !== "TITLE") {
                child.remove();
            }
        });
        // Add new elements
        Array.from(newHead.children).forEach((child) => {
            if (child.tagName !== "STYLE" && child.tagName !== "TITLE") {
                oldHead.appendChild(child.cloneNode(true));
            }
        });
        console.log("Head updated, xref style element preserved");
    }
    updateBody(newDoc) {
        console.log("started -> updateBody() Method");
        const swapHtml = this.options.swapHtml || "body";
        const oldElement = document.querySelector(swapHtml);
        const newElement = newDoc.querySelector(swapHtml);
        if (!oldElement) {
            console.error(`Old document does not contain element: ${swapHtml}`);
            return;
        }
        if (!newElement) {
            console.error(`New document does not contain element: ${swapHtml}`);
            return;
        }
        // Type assertions
        this.performTransition(oldElement, newElement);
        /* this.removeInlineStylesFromRoot(); */
    }
    performTransition(oldBody, newBody) {
        console.log("Started performTransition");
        const transitionOptions = this.options.transition || {};
        const duration = transitionOptions.duration || 300;
        const delay = transitionOptions.delay || 0;
        const easing = transitionOptions.easing || "ease-in-out";
        const timeline = transitionOptions.timeline || "sequential";
        let outTransition = transitionOptions.out;
        let inTransition = transitionOptions.in;
        // If no out transition is set, reverse the in transition
        if (!outTransition && inTransition) {
            outTransition = this.reverseTransition(inTransition);
        }
        // If no in transition is set, reverse the out transition
        else if (!inTransition && outTransition) {
            inTransition = this.reverseTransition(outTransition);
        }
        console.log("Transition options:", { duration, delay, easing, timeline });
        console.log("Out transition:", outTransition);
        console.log("In transition:", inTransition);
        if (outTransition) {
            console.log("Applying out transition");
            this.applyTransition(oldBody, outTransition, duration, delay, easing, "out");
        }
        const applyInTransition = () => {
            console.log("Applying in transition");
            // Remove the "out" animation
            oldBody.style.removeProperty('animation');
            oldBody.innerHTML = newBody.innerHTML;
            Array.from(newBody.attributes).forEach((attr) => {
                if (attr.name !== "style") {
                    oldBody.setAttribute(attr.name, attr.value);
                }
            });
            if (inTransition) {
                this.applyTransition(oldBody, inTransition, duration, 0, easing, "in");
            }
        };
        if (timeline === "sequential") {
            console.log(`Setting timeout for in transition: ${duration + delay}ms`);
            setTimeout(applyInTransition, duration / 2 + delay);
        }
        else {
            console.log(`Setting timeout for in transition: ${delay}ms (parallel)`);
            setTimeout(applyInTransition, delay);
        }
    }
    reverseTransition(transition) {
        return {
            from: transition.to,
            to: transition.from,
        };
    }
    applyTransition(element, transitionState, duration, delay, easing, direction) {
        console.log(`Applying ${direction} transition`);
        const keyframeName = this.createKeyframes(transitionState, direction);
        const animationCSS = `${keyframeName} ${duration}ms ${easing} ${delay}ms forwards`;
        // Ensure we're setting the animation property correctly
        element.style.setProperty('animation', animationCSS);
        console.log(`Applied ${direction} animation: ${animationCSS}`);
        console.log(`Current element style:`, element.style.cssText);
        // Force a reflow to ensure the animation is applied immediately
        void element.offsetWidth;
        const cleanup = () => {
            console.log(`Animation end event fired for ${direction} transition`);
            element.style.removeProperty('animation');
            // Remove the keyframe immediately after the animation is complete
            this.removeKeyframes(keyframeName);
            if (direction === "in") {
                Object.entries(transitionState.to || {}).forEach(([key, value]) => {
                    element.style.setProperty(this.camelToKebab(key), value);
                });
            }
            console.log(`Cleaned up ${direction} animation`);
            console.log(`Current element style after cleanup:`, element.style.cssText);
            element.removeEventListener("animationend", cleanup);
        };
        element.addEventListener("animationend", cleanup, { once: true });
    }
    camelToKebab(str) {
        return str.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
    }
}
function xref(options = {}) {
    return new Xref(options);
}

export { xref as default };
//# sourceMappingURL=xref.esm.js.map
