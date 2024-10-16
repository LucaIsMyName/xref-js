# `xref({})`

`xref` is a lightweight JavaScript library that transforms multi-page applications (MPAs) into smooth, single-page-like experiences. It leverages the power of AJAX and CSS transitions to create seamless page transitions without the complexity of a full single-page application (SPA) framework.

*This package is a Experimental. API is subject to change.*

## Features

- Easy integration with existing multi-page websites
- Smooth page transitions with customizable animations
- Maintains browser history and supports back/forward navigation
- Lightweight and dependency-free
- TypeScript support

## Install

```bash
npm install xref-js
```

```bash
yarn add xref-js
```

```html
<script src="https://unpkg.com/xref-js@latest/dist/xref.umd.js" defer></script>
```

## Basic Usage

### 1. Import

```js
import xref from 'xref-js';
```

### 2. Initialize xref with your desired options:

```js
xref({
  /**
   * `prefetch` can fetch HTML Pages
   * before clicking on them by 
   * setting `prefetch.active` to
   * `true`, `event:'mouseover'` &
   * `delay:0` are default
   */
  prefetch: {
    active: true,
    // delay: 0,
    // event: 'mouseover',
  },
  /**
   * `transition` is the global 
   * Object for transition out and
   * in of pages. 
  */
  transition: {
    /**
     * the DOM Element to swap to the new
     * HTML content to (everything outside
     * stays as on initial page load!)
     */
    swapHtml: 'main',
    /**
     * duration of the main
     * animation in and out!
     * info: duration times of
     * in and out are added.
     * depeding on partial 
     * transtion duration
     * animation is:
     * ________________
     *   [t] of partial out
     * + [t] of swapHtml out
     * + [t] of swapHtml in
     * + [t] of partial in
     * ________________
     * = total time of transition
    */
    duration: 100,
    /**
     * Easing function of the 
     * main page transition
    */
    easing: 'ease',
    /**
     * the transition when the element
     * is inserted in the page
     */
    in: {
      /**
       * translates to CSS Keyframes
       * @keyframe xref-animation-in-[i] {
       *    0%: {
       *      opacity: 0
       *    },
       *    100% {
       *      // if  'to' is set here would be something
       *    }
       * }
      */
      from: {
        opacity: 0,
        filter: 'blur(50px)'
      },
    },
    /**
     * the transition when the element
     * is removed from the page
     */
    out: {
      /**
       * translates to CSS Keyframes
       * @keyframe xref-animation-in-[i] {
       *    0%: {
       *       // if  'from' is set here would be something
       *    },
       *    100% {
       *      opacity: 0
       *    }
       * }
      */
      to: {
        opacity: 0,
        filter: 'blur(50px)'
      }
    },
    callback: {
      onEnter: () => {},
      onStart: () => {},
      onPlay: () => {},
      onPause: () => {},
      onFinish: () => {}
    }
    /** `transition.partials` is an Array of HTMLElements that can be animated 
     * out BEFORE the `transition.swapHtml` Element is animated out 
     * and AFTER the the `transition.swapHtml` Element is animated in.
     */
    partials: [
      {
        element: 'header, footer, aside',
        duration: 100,
        easing: 'ease-in-out',
        in: {
          from: {
            opacity: 0,
          },
        },
        out: {
          to: {
            opacity: 0,
          }
        }
      },
    ]
  }
});
```

You can have seperate animations for 'in' and 'out' or set either one them, the missing one is assumed the provided played backwards!

You can set 'from' and 'to' optionaly, it would make sense to only do 'from' in the 'in' objecte and do 'to' in the 'out' object.

### 3. Ensure your HTML links are relative or to the same domain:

```html
<a href="/about">About</a>
<a href="/contact">Contact</a>
```

`xref` will automatically intercept clicks on these links and handle the page transitions.

## How It Works

`xref` intercepts clicks on links within your site. Instead of allowing the browser to load a new page, it:

1. Fetches the new page content via AJAX
2. Smoothly transitions out the current page content
3. Updates the browser's history
4. Swaps in the new page content with a transition effect
5. Manages the `<head>` tag to ensure styles and scripts are correctly updated

This creates a fluid, app-like experience while maintaining the structure and SEO benefits of a traditional multi-page site.

## Advanced Usage

xref offers several advanced features and customization options:

- Custom transition effects
- Control over which HTML element is swapped
- Handling of external scripts and styles
- Integration with CSS frameworks like Tailwind CSS

Refer to the full documentation for detailed information on these features.

## API & Types

```typescript
interface XrefOptions: {
  transition?: {
    swapHtml?: string,
    duration?: number,
    easing?: string,
    out?: {
      from?: Record<string?, string | number | boolean>,
      to?: Record<string?, string | number | boolean>,
    },
    in?: {
      from?: Record<string?, string | number | boolean>,
      to?: Record<string?, string | number | boolean>,
    },
    callback?: {
      onEnter?: Function,
      onStart?: Function,
      onPlay?: Function,
      onPause?: Function,
      onFinish?: Function
    },
    state?: {
      started?: boolean,
      playing?: boolean,
      paused?: boolean,
      finished?: boolean,
    },
    /**********************
    ** Work in Progress **
    **********************/
    partials?: [
        {
          element?: string, // any document.querySelectorAll(string) passable string
          duration?: number,
          easing?: string,
          transition?: {
            out?: {
              from?: Record<string?, string | number | boolean>,
              to?: Record<string?, string | number | boolean>,
            },
            in?: {
              from?: Record<string?, string | number | boolean>,
              to?: Record<string?, string | number | boolean>,
            }
          },
        }
      ]
    }
  },
  prefetch?: {
    active?: boolean,
    event?: string,
    delay?: number
  },

  /*****************************
   ** Work in Progress / Idea **
  ******************************/
  head?: {
    update?: boolean,
    retrigger?: {
      css?: boolean,
      js?: boolean,
      include?: RegexPattern | string,
      exclude?: RegexPattern | string,
    },
  }
};
```

## Browser Support

`xref` works in all modern browsers that support the History API and CSS transitions. For older browsers, it will gracefully fall back to normal page loads.

## Issues  & future Features

- implement `options.head.active:boolean` -> change from `options.updateHead`
- implement `options.head.exclude:Array<string>` and `options.head.include:Array<string>` -> update or not update scripts or css when pages are swapped
- implement `option.prefetch.media:boolean`
