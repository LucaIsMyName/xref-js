# `xref()`

*This package is a Experimental. API is subject to change.*

`xref` is a lightweight JavaScript library that transforms multi-page applications (MPAs) into smooth, single-page-like experiences. It leverages the power of AJAX and CSS transitions to create seamless page transitions without the complexity of a full single-page application (SPA) framework.

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
<script src="https://unpkg.com/xref-js@latest/dist/xref.min.js"></script>
```

## Basic Usage

1. Import

```js
import xref from 'xref-js';
```

2. Initialize xref with your desired options:

```js
xref({
  swapHtml: 'body', // The element to swap during transitions
  transition: {
    duration: 300,
    delay: 0,
    easing: 'ease-in-out',
    in: {
      from: { opacity: 0, transform: 'translateY(20px)' },
    },
    out: {
      to: { opacity: 0 }
    }
  }
});
```

You can have seperate animations for 'in' and 'out' or set either one them, the missing one is assumed the provided played backwards!

You can set 'from' and 'to' optionaly, it would make sense to only do 'from' in the 'in' objecte and do 'to' in the 'out' object

3. Ensure your HTML links are relative or to the same domain:

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

## Browser Support

`xref` works in all modern browsers that support the History API and CSS transitions. For older browsers, it will gracefully fall back to normal page loads.

## Issues  & future Features

- implement `options.swapHtml` -> eg. swap only the `<main>` tag
- implement `options.prefetch` -> `options.prefetch.active`, `options.prefetch.event`, `options.delay` -> `src/prefetch.ts`
- implement `options.timeline: 'sequential' || 'parallel'` (if possible, or depract)
- implement `options.head.active:boolean` -> change from `options.updateHead`
- implement `options.head.exclude:Array<string>` and `options.head.include:Array<string>` -> update or not update scripts or css when pages are swapped
- implement `options.callback.onStart:Function` -> am optinal callback function when transition is started
implement `options.callback.onFinish:Function` -> am optinal callback function when transition is finished
