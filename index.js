
function $parcel$defineInteropFlag(a) {
  Object.defineProperty(a, '__esModule', {value: true, configurable: true});
}

function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$defineInteropFlag(module.exports);

$parcel$export(module.exports, "default", () => $882b6d93070905b3$export$2e2bcd8739ae039);
// src/index.ts
class $882b6d93070905b3$var$Xref {
    constructor(options){
        this.styleElement = null;
        this.options = options;
        this.init();
    }
    init() {
        if (!document.startViewTransition) {
            console.warn("View Transitions API is not supported in this browser. Xref will not apply transitions.");
            return;
        }
        this.setupPrefetching();
        this.setupViewTransitions();
    }
    setupPrefetching() {
        if (!this.options.prefetch.isActive) return;
        document.addEventListener("click", (e)=>{
            const target = e.target;
            const link = target.closest("a");
            if (link && this.isInternalLink(link)) {
                e.preventDefault();
                setTimeout(()=>this.prefetchPage(link.href), this.options.prefetch.delay);
            }
        });
    }
    isInternalLink(link) {
        return link.href.startsWith(window.location.origin);
    }
    async prefetchPage(url) {
        try {
            const response = await fetch(url, {
                method: "GET"
            });
            const text = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(text, "text/html");
            console.log(`Prefetched: ${url}`);
        } catch (error) {
            console.error(`Failed to prefetch ${url}:`, error);
        }
    }
    setupViewTransitions() {
        document.addEventListener("click", (e)=>{
            const target = e.target;
            const link = target.closest("a");
            if (link && this.isInternalLink(link)) {
                e.preventDefault();
                this.transitionToPage(link.href);
            }
        });
    }
    async transitionToPage(url) {
        const transition = document.startViewTransition(async ()=>{
            const response = await fetch(url);
            const text = await response.text();
            document.body.innerHTML = text;
            document.documentElement.scrollTop = 0;
        });
        this.applyTransitionStyles(transition);
    }
    applyTransitionStyles(transition) {
        const { duration: duration, delay: delay, easing: easing, in: inTransition, out: outTransition } = this.options.transition;
        const styles = `
      ::view-transition-old(*) {
        animation: ${duration}ms ${delay}ms ${easing} both ${this.createKeyframes(outTransition)};
      }
      ::view-transition-new(*) {
        animation: ${duration}ms ${delay}ms ${easing} both ${this.createKeyframes(inTransition)};
      }
    `;
        this.styleElement = document.createElement("style");
        this.styleElement.textContent = styles;
        document.head.appendChild(this.styleElement);
        transition.finished.then(()=>{
            if (this.styleElement) {
                this.styleElement.remove();
                this.styleElement = null;
            }
        });
    }
    objectToCSSString(obj) {
        return Object.entries(obj).map(([key, value])=>`${this.camelToKebabCase(key)}: ${value};`).join(" ");
    }
    camelToKebabCase(str) {
        return str.replace(/[A-Z]/g, (letter)=>`-${letter.toLowerCase()}`);
    }
    animate(selector, options) {
        const elements = typeof selector === "string" ? document.querySelectorAll(selector) : selector;
        const { duration: duration, delay: delay, easing: easing, in: inTransition, out: outTransition } = options;
        elements.forEach((element, index)=>{
            const elementId = `xref-animated-${index}`;
            element.id = elementId;
            const inKeyframes = this.createKeyframes(inTransition, "in");
            const outKeyframes = this.createKeyframes(outTransition, "out");
            const styles = `
        @keyframes ${inKeyframes.name} {
          ${inKeyframes.rules}
        }
        @keyframes ${outKeyframes.name} {
          ${outKeyframes.rules}
        }
        #${elementId} {
          animation: ${duration}ms ${delay}ms ${easing} both var(--xref-animation-name);
        }
        #${elementId}::view-transition-new {
          animation: ${duration}ms ${delay}ms ${easing} both ${inKeyframes.name};
        }
        #${elementId}::view-transition-old {
          animation: ${duration}ms ${delay}ms ${easing} both ${outKeyframes.name};
        }
      `;
            const styleElement = document.createElement("style");
            styleElement.textContent = styles;
            document.head.appendChild(styleElement);
            // Set initial styles
            element.style.setProperty("--xref-animation-name", "none");
            // Apply animations when a view transition starts
            document.addEventListener("startViewTransition", ()=>{
                element.style.setProperty("--xref-animation-name", outKeyframes.name);
            });
            // Clean up after the transition
            document.addEventListener("finishViewTransition", ()=>{
                element.style.setProperty("--xref-animation-name", "none");
            });
        });
    }
    createKeyframes(transition, type) {
        const name = `xref-${type}-${Math.random().toString(36).substr(2, 9)}`;
        const fromStyles = this.objectToCSSString(transition.from);
        const toStyles = this.objectToCSSString(transition.to);
        const rules = `
      from { ${fromStyles} }
      to { ${toStyles} }
    `;
        return {
            name: name,
            rules: rules
        };
    }
}
function $882b6d93070905b3$export$2e2bcd8739ae039(options) {
    return new $882b6d93070905b3$var$Xref(options);
}
$882b6d93070905b3$export$2e2bcd8739ae039.animate = (selector, options)=>{
    const xrefInstance = new $882b6d93070905b3$var$Xref({
        prefetch: {
            isActive: false,
            event: "",
            delay: 0
        },
        transition: options
    });
    xrefInstance.animate(selector, options);
};


//# sourceMappingURL=index.js.map
