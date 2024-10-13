'use strict';

class Prefetcher {
    /**
     *
     * @description Initializes the prefetcher
     * with the given options.
     */
    constructor(options, xrefOptions) {
        this.cache = new Map();
        this.options = options;
        this.xrefOptions = xrefOptions;
        this.init();
    }
    /**
     * @description Initializes the prefetcher by
     * adding an event listener to the document.
     */
    init() {
        if (!this.options.active)
            return;
        document.addEventListener(this.options.event || "mouseover", this.handleEvent.bind(this));
    }
    /**
     *
     * @description Handles the event by checking if the target
     * is an anchor element and if it should be prefetched.
     */
    handleEvent(event) {
        const target = event.target;
        const link = target.closest(this.options.selector || "a");
        if (link && this.shouldPrefetch(link)) {
            setTimeout(() => this.prefetch(link.href), this.options.delay || 100);
        }
    }
    /**
     *
     * @description Checks if the link should be prefetched.
     * It should be prefetched if it's an anchor element, it's
     * not the current page, and it's not already in the cache.
     */
    shouldPrefetch(link) {
        return !!(link.href && link.href.startsWith(window.location.origin) && link.href !== window.location.href && !this.cache.has(link.href));
    }
    /**
     *
     * @description Fetches the content of the given URL
     * and stores it in the cache. If the fetch fails, it logs
     * an error to the console.
     */
    async prefetch(url) {
        try {
            const response = await fetch(url);
            const text = await response.text();
            this.cache.set(url, text);
            this.xrefOptions.debug ? console.log(`Prefetched: ${url}`) : null;
        }
        catch (error) {
            this.xrefOptions.debug ? console.error("Failed to prefetch:" + url, error) : null;
        }
    }
    /**
     *
     * @description Gets the content of the given URL
     * from the cache. If the content is not in the cache,
     * it returns null. Otherwise, it returns the content.
     * This method is used by the Xref instance to get the
     * content of a URL before navigating to it.
     */
    getContent(url) {
        return this.cache.get(url) || null;
    }
}
function initPrefetcher(options, xrefOptions) {
    return new Prefetcher(options, xrefOptions);
}

/**
 * The main Xref class that handles
 * navigation and transitions.
 *
 * @returns The Xref instance.
 *
 * @description This is the main class that handles navigation and transitions.
 * It intercepts clicks on internal links, fetches the content of the linked page,
 * updates the document head and body, and performs transitions between the
 * old and new content. It also handles popstate events to support back
 * and forward navigation.
 */
class Xref {
    /**
     * @description This is the constructor of the Xref class.
     * It initializes the Xref instance with the given options,
     * creates a style element to store the keyframes for transitions,
     * and sets the initial animation state.
     */
    constructor(options = {}) {
        var _a;
        this.transitionCounter = 0;
        this.prefetcher = null;
        this.currentKeyframeName = null;
        this.options = Object.assign({ updateHead: true }, options);
        this.styleElement = document.createElement("style");
        this.styleElement.setAttribute("data-xref", "true");
        document.head.appendChild(this.styleElement);
        this.animationState = Object.assign({ started: false, playing: true, paused: false, finished: false }, (_a = this.options.transition) === null || _a === void 0 ? void 0 : _a.state);
        this.init();
    }
    /**
     * @description This method initializes the Xref instance
     * by intercepting clicks on internal links, handling popstate events,
     * and initializing the prefetcher if prefetching is enabled.
     */
    init() {
        this.options.debug ? console.log("started -> init() Method") : null;
        this.interceptClicks();
        this.handlePopState();
        if (this.options.prefetch && this.options.prefetch.active) {
            this.prefetcher = initPrefetcher(this.options.prefetch, this.options);
        }
    }
    /**
     * @description This method creates keyframes
     * for the given transition state
     * and direction.
     */
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
        this.options.debug ? console.log("Creating keyframe:" + keyframeName) : null;
        this.options.debug ? console.log("Keyframe CSS:" + keyframeCSS) : null;
        // Remove the previous keyframe if it exists
        if (this.currentKeyframeName) {
            this.removeKeyframes(this.currentKeyframeName);
        }
        // Append the new keyframe to the style element's content
        this.styleElement.textContent = keyframeCSS;
        this.currentKeyframeName = keyframeName;
        this.options.debug ? console.log("Keyframe " + keyframeName + "appended to <style> element") : null;
        this.options.debug ? console.log("Current <style> content: " + this.styleElement.textContent) : null;
        return keyframeName;
    }
    /**
     * @param keyframeName
     * @description This method removes the keyframes
     * with the given name from the style element.
     */
    removeKeyframes(keyframeName) {
        this.options.debug ? console.log("Removing keyframe: " + keyframeName) : null;
        this.styleElement.textContent = "";
        this.options.debug ? console.log("Keyframe" + keyframeName + "removed") : null;
        this.options.debug ? console.log("Current <style> content after removal:" + this.styleElement.textContent) : null;
        this.currentKeyframeName = null;
    }
    /**
     * @description This method intercepts clicks
     * on internal links and prevents the default
     * browser navigation behavior.
     */
    interceptClicks() {
        this.options.debug ? console.log("started -> interceptClicks() Method") : null;
        document.addEventListener("click", (event) => {
            const target = event.target;
            const anchor = target.closest("a");
            if (anchor && this.shouldIntercept(anchor)) {
                event.preventDefault();
                this.runCallback("onEnter");
                this.navigate(anchor.href);
            }
        });
    }
    /**
     * @description This method checks if the
     * anchor should be intercepted based on
     * the current URL and the anchor's href.
     */
    shouldIntercept(anchor) {
        this.options.debug ? console.log("started -> shouldIntercept() Method") : null;
        const currentUrl = new URL(window.location.href);
        const linkUrl = new URL(anchor.href);
        // Check if it's an internal link
        const isSameOrigin = linkUrl.origin === currentUrl.origin;
        // Check if it's not the current page or just a hash change
        const isSamePage = linkUrl.pathname === currentUrl.pathname && linkUrl.search === currentUrl.search;
        const isJustHashChange = isSamePage && linkUrl.hash !== currentUrl.hash;
        // Intercept only if it's an internal link and not the same page or just a hash change
        return isSameOrigin && !isSamePage && !isJustHashChange;
    }
    /**
     * @description This method handles popstate events
     * to support back and forward navigation.
     */
    handlePopState() {
        this.options.debug ? console.log("started -> handlePopState() Method") : null;
        window.addEventListener("popstate", () => {
            this.navigate(window.location.href, false);
        });
    }
    /**
     * @description This method navigates to the given URL
     * and updates the page content. If prefetching is enabled
     * and the content is already prefetched, it uses the
     * prefetched content instead of fetching it again.
     * If pushState is true, it updates the browser history.
     */
    async navigate(url, pushState = true) {
        this.options.debug ? console.log("started -> navigate() Method") : null;
        try {
            let content = null;
            if (this.prefetcher) {
                content = this.prefetcher.getContent(url);
            }
            if (!content) {
                content = await this.fetchPage(url);
            }
            if (content) {
                if (pushState) {
                    history.pushState(null, "", url);
                }
                this.updatePage(content);
            }
        }
        catch (error) {
            this.options.debug ? console.error("Navigation failed:", error) : null;
        }
    }
    /**
     * @description This method fetches the content of the given URL
     * and returns it as a string. It throws an error if the request fails.
     */
    async fetchPage(url) {
        this.options.debug ? console.log("started -> fetchPage() Method") : null;
        const response = await fetch(url);
        if (!response.ok)
            throw new Error(`HTTP error! status: ${response.status}`);
        return await response.text();
    }
    /**
     * @description This method updates the page content
     * with the new content fetched from the server.
     * It updates the head and body of the document
     * based on the new content.
     */
    updatePage(content) {
        this.options.debug ? console.log("started -> updatePage() Method") : null;
        const parser = new DOMParser();
        const newDoc = parser.parseFromString(content, "text/html");
        this.updateHead(newDoc);
        this.updateBody(newDoc);
    }
    /**
     * @description This method updates the head of the document
     * with the new head from the fetched content. It updates
     * the title and other head elements based on the new content.
     */
    updateHead(newDoc) {
        this.options.debug ? console.log("started -> updateHead() Method") : null;
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
        this.options.debug ? console.log("Head updated, xref style element preserved") : null;
    }
    /**
     * @description This method updates the body of the document
     * with the new body from the fetched content. It updates
     * the content of the swapHtml element based on the new content.
     * It also performs the transition between the old and new content.
     */
    updateBody(newDoc) {
        var _a;
        this.options.debug ? console.log("started -> updateBody() Method") : null;
        const swapHtml = ((_a = this.options.transition) === null || _a === void 0 ? void 0 : _a.swapHtml) || "body";
        const oldElement = document.querySelector(swapHtml);
        const newElement = newDoc.querySelector(swapHtml);
        if (!oldElement) {
            this.options.debug ? console.error(`Old document does not contain element: ${swapHtml}`) : null;
            return;
        }
        if (!newElement) {
            this.options.debug ? console.error(`New document does not contain element: ${swapHtml}`) : null;
            return;
        }
        this.performTransition(oldElement, newElement);
        window.scrollTo(0, 0);
    }
    /**
     * @description This method performs the transition
     * between the old and new content by applying the
     * in and out transitions to the elements.
     * It also handles the transition timeline, duration,
     * delay, and easing.
     */
    performTransition(oldElement, newElement) {
        this.options.debug ? console.log("Started performTransition") : null;
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
        this.setTransitionState("started", true);
        this.runCallback("onStart");
        if (outTransition) {
            this.options.debug ? console.log("Applying out transition") : null;
            this.applyTransition(oldElement, outTransition, duration, delay, easing, "out");
        }
        const applyInTransition = () => {
            this.options.debug ? console.log("Applying in transition") : null;
            // Remove the "out" animation
            oldElement.style.removeProperty("animation");
            oldElement.innerHTML = newElement.innerHTML;
            Array.from(newElement.attributes).forEach((attr) => {
                if (attr.name !== "style") {
                    oldElement.setAttribute(attr.name, attr.value);
                }
            });
            if (inTransition) {
                this.applyTransition(oldElement, inTransition, duration, 0, easing, "in");
            }
        };
        if (timeline === "sequential") {
            this.options.debug ? console.log(`Setting timeout for in transition: ${duration + delay}ms`) : null;
            setTimeout(applyInTransition, duration + delay);
        }
        else {
            this.options.debug ? console.log(`Setting timeout for in transition: ${delay}ms (parallel)`) : null;
            setTimeout(applyInTransition, delay);
        }
    }
    /**
     * @description This method reverses the given transition
     * by swapping the from and to states. This is useful
     * for creating the "out" transition from the "in" transition.
     */
    reverseTransition(transition) {
        return {
            from: transition.to,
            to: transition.from,
        };
    }
    /**
     * @description This method applies the transition to the element
     * by creating the keyframes, setting the animation properties,
     * and cleaning up after the animation is complete.
     */
    applyTransition(element, transitionState, duration, delay, easing, direction) {
        const customEasings = {
            easeInOut: "cubic-bezier(0.42, 0, 0.58, 1)",
            easeIn: "cubic-bezier(0.42, 0, 1, 1)",
            easeOut: "cubic-bezier(0, 0, 0.58, 1)",
            linearDegressive: "cubic-bezier(0.25, 0.1, 0.25, 1)",
            linearProgressive: "cubic-bezier(0.1, 0.25, 1, 0.25)",
            easeInSine: "cubic-bezier(0.47, 0, 0.745, 0.715)",
            easeOutSine: "cubic-bezier(0.39, 0.575, 0.565, 1)",
            easeInOutSine: "cubic-bezier(0.445, 0.05, 0.55, 0.95)",
            easeInQuad: "cubic-bezier(0.55, 0.085, 0.68, 0.53)",
            easeOutQuad: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
            easeInOutQuad: "cubic-bezier(0.455, 0.03, 0.515, 0.955)",
            easeInCubic: "cubic-bezier(0.55, 0.055, 0.675, 0.19)",
            easeOutCubic: "cubic-bezier(0.215, 0.61, 0.355, 1)",
            easeInOutCubic: "cubic-bezier(0.645, 0.045, 0.355, 1)",
        };
        for (const [key, value] of Object.entries(customEasings)) {
            if (easing === key) {
                easing = value;
            }
        }
        this.options.debug ? console.log(`Applying ${direction} transition`) : null;
        const keyframeName = this.createKeyframes(transitionState, direction);
        const animationCSS = `${keyframeName} ${duration}ms ${easing} ${delay}ms forwards`;
        // Ensure we're setting the animation property correctly
        element.style.setProperty("animation", animationCSS);
        this.options.debug ? console.log("Applied " + direction + " animation: " + animationCSS) : null;
        this.options.debug ? console.log("Current element style:", element.style.cssText) : null;
        // Force a reflow to ensure the animation is applied immediately
        void element.offsetWidth;
        this.setTransitionState("playing", true);
        this.runCallback("onPlay");
        const cleanup = () => {
            this.options.debug ? console.log(`Animation end event fired for ${direction} transition`) : null;
            element.style.removeProperty("animation");
            // Remove the keyframe immediately after the animation is complete
            this.removeKeyframes(keyframeName);
            if (direction === "in") {
                Object.entries(transitionState.to || {}).forEach(([key, value]) => {
                    element.style.setProperty(this.camelToKebab(key), value);
                });
            }
            this.options.debug ? console.log("Cleaned up " + direction + " animation") : null;
            this.options.debug ? console.log("Current element style after cleanup:", element.style.cssText) : null;
            element.removeEventListener("animationend", cleanup);
            this.setTransitionState("finished", true);
            this.runCallback("onFinish");
        };
        element.addEventListener("animationend", cleanup, { once: true });
    }
    /**
     * @description This method sets the transition state
     * based on the given key and value. This is useful
     * for tracking the state of the transition.
     */
    setTransitionState(key, value) {
        this.animationState[key] = value;
    }
    runCallback(callbackName) {
        var _a, _b;
        const callback = (_b = (_a = this.options.transition) === null || _a === void 0 ? void 0 : _a.callback) === null || _b === void 0 ? void 0 : _b[callbackName];
        if (callback && typeof callback === "function") {
            callback();
        }
    }
    /**
     * @description This method starts the transition
     * and sets the animation state accordingly.
     */
    startTransition() {
        this.setTransitionState("started", true);
        this.setTransitionState("playing", true);
        this.setTransitionState("paused", false);
        this.setTransitionState("finished", false);
        this.runCallback("onStart");
        this.runCallback("onPlay");
    }
    /**
     * @description This method pauses the transition
     * and sets the animation state accordingly.
     */
    pauseTransition() {
        var _a;
        if (this.animationState.playing) {
            this.setTransitionState("playing", false);
            this.setTransitionState("paused", true);
            this.runCallback("onPause");
            // Pause transition
            const element = document.querySelector(((_a = this.options.transition) === null || _a === void 0 ? void 0 : _a.swapHtml) || "body");
            if (element) {
                element.style.animationPlayState = "paused";
            }
        }
    }
    /**
     * @description This method resumes the transition
     * and sets the animation state accordingly.
     */
    resumeTransition() {
        var _a;
        if (this.animationState.paused) {
            this.setTransitionState("playing", true);
            this.setTransitionState("paused", false);
            this.runCallback("onPlay");
            // play transition
            const element = document.querySelector(((_a = this.options.transition) === null || _a === void 0 ? void 0 : _a.swapHtml) || "body");
            if (element) {
                element.style.animationPlayState = "running";
            }
        }
    }
    /**
     * @description This method finishes the transition
     * and cleans up the animation
     * */
    finishTransition() {
        this.setTransitionState("playing", false);
        this.setTransitionState("paused", false);
        this.setTransitionState("finished", true);
        this.runCallback("onFinish");
    }
    /**
     * @description This method converts
     * camel case to kebab case
     */
    camelToKebab(str) {
        return str.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
    }
}
function xref(options = {}) {
    return new Xref(options);
}

module.exports = xref;
//# sourceMappingURL=xref.js.map
