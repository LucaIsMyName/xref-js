class Xref {
    constructor(options = {}) {
        this.tailwindStyleElement = null;
        this.options = Object.assign({ updateHead: true }, options);
        this.init();
    }
    init() {
        this.interceptClicks();
        this.handlePopState();
        this.initTailwindStyle();
    }
    removeInlineStylesFromRoot() {
        /**
         * remove the transitioned nline styles from the swapHtml element
         */
        const swapHtml = this.options.swapHtml || "body";
        const rootElement = document.querySelector(swapHtml);
        if (!rootElement) {
            return;
        }
        rootElement.removeAttribute("style");
    }
    initTailwindStyle() {
        this.tailwindStyleElement = document.querySelector("style[data-tailwind]");
        if (!this.tailwindStyleElement) {
            this.tailwindStyleElement = document.createElement("style");
            this.tailwindStyleElement.setAttribute("data-tailwind", "true");
            document.head.appendChild(this.tailwindStyleElement);
        }
    }
    interceptClicks() {
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
        const isSameOrigin = anchor.origin === window.location.origin;
        const isNotHash = anchor.hash === "";
        return isSameOrigin && isNotHash;
    }
    handlePopState() {
        window.addEventListener("popstate", () => {
            this.navigate(window.location.href, false);
        });
    }
    async navigate(url, pushState = true) {
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
        const response = await fetch(url);
        if (!response.ok)
            throw new Error(`HTTP error! status: ${response.status}`);
        return await response.text();
    }
    updatePage(content) {
        const parser = new DOMParser();
        const newDoc = parser.parseFromString(content, "text/html");
        this.updateHead(newDoc);
        this.updateBody(newDoc);
    }
    updateHead(newDoc) {
        const oldHead = document.head;
        const newHead = newDoc.head;
        // Always update the title
        document.title = newDoc.title;
        // If updateHead is false, don't update anything else in the head
        if (this.options.updateHead === false) {
            return;
        }
        // Update Tailwind styles
        const newTailwindStyle = newDoc.querySelector("style[data-tailwind]");
        if (newTailwindStyle && this.tailwindStyleElement) {
            this.tailwindStyleElement.textContent = newTailwindStyle.textContent;
        }
        // update all scripts!
        const allScripts = Array.from(document.querySelectorAll("script"));
        const newScripts = Array.from(newDoc.querySelectorAll("script"));
        allScripts.forEach((script) => {
            script.remove();
        });
        newScripts.forEach((script) => {
            document.body.appendChild(script.cloneNode(true));
        });
        // Remove old elements except Tailwind style
        Array.from(oldHead.children).forEach((child) => {
            if (child !== this.tailwindStyleElement && child.tagName !== 'TITLE') {
                child.remove();
            }
        });
        // Add new elements
        Array.from(newHead.children).forEach((child) => {
            if (child.tagName !== "STYLE" || !child.getAttribute("data-tailwind")) {
                if (child.tagName !== 'TITLE') {
                    oldHead.appendChild(child.cloneNode(true));
                }
            }
        });
    }
    updateBody(newDoc) {
        const oldBody = document.body;
        const newBody = newDoc.body;
        if (!newBody) {
            console.error("New document does not contain a body tag");
            return;
        }
        this.performTransition(oldBody, newBody);
    }
    performTransition(oldBody, newBody) {
        const transitionOptions = this.options.transition || {};
        const duration = transitionOptions.duration || 300;
        const delay = transitionOptions.delay || 0;
        const easing = transitionOptions.easing || "ease";
        // Apply 'out' transition
        this.applyTransition(oldBody, transitionOptions.out, duration, delay, easing, "out");
        // Apply 'in' transition
        setTimeout(() => {
            oldBody.innerHTML = newBody.innerHTML;
            Array.from(newBody.attributes).forEach((attr) => {
                if (attr.name !== "style") {
                    oldBody.setAttribute(attr.name, attr.value);
                }
            });
            this.applyTransition(oldBody, transitionOptions.in, duration, 0, easing, "in");
        }, transitionOptions.timeline === "sequential" ? duration + delay : delay);
    }
    applyTransition(element, transitionState, duration, delay, easing, direction) {
        if (!transitionState)
            return;
        const { from, to } = transitionState;
        const transitionProperties = [];
        let styles = "";
        if (from) {
            Object.entries(from).forEach(([key, value]) => {
                const prop = this.camelToKebab(key);
                styles += `${prop}: ${value}; `;
                transitionProperties.push(prop);
            });
        }
        styles += `transition: ${transitionProperties.map((prop) => `${prop} ${duration}ms ${easing} ${delay}ms`).join(", ")};`;
        element.setAttribute("style", styles);
        if (to) {
            requestAnimationFrame(() => {
                let newStyles = "";
                Object.entries(to).forEach(([key, value]) => {
                    const prop = this.camelToKebab(key);
                    newStyles += `${prop}: ${value}; `;
                });
                newStyles += `transition: ${transitionProperties.map((prop) => `${prop} ${duration}ms ${easing} ${delay}ms`).join(", ")};`;
                element.setAttribute("style", newStyles);
            });
        }
        element.addEventListener("transitionend", () => {
            var _a;
            (_a = document.querySelector(this.options.swapHtml || "body")) === null || _a === void 0 ? void 0 : _a.removeAttribute("style");
        }, { once: false });
    }
    camelToKebab(str) {
        return str.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
    }
}
function xref(options = {}) {
    return new Xref(options);
}

export { xref as default };
