# `xref`



```js
import xref from 'xref-js'

/**
 * xref() is the global function to call that 
 * turns an MPA into and SPA using the native browser 
 * viewTransiton() API!
 * 
*/
xref(
  {
    /** 
     * swapHtml is an optional parameter where i can define
     * the html element that should be transitioned, all elements that
     * are outisde the eg. <main> tag dont get swapperd at all!
     * if i dont set `swapHtml`, assume i want to change the whole
     * source code of the pages <body> tag
     * this doent not apply to all elements inside <head> tag,
     * the <head> is handleled seperately by xref,
     * it's get's re-rendered if the page changes
    */
    swapHtml: 'main', 
    /**
     * if prefecth.isActive === true
     * all links get prefetched by the browser/html
     * on the given event (eg "mouseover in this case)
     * the prefetch.delay is a timeout for the prefetch (event triggered + timeout = then prefetch the html page)
    */
    prefetch: {
      isActive: true,
      event: 'mouseover',
      delay: 1000,
    },
    /**
     * the transition object can take
     * transition.duration: time of viewTransition in MS
     * transition.delay: the delay of the viewportTRansition after triggering a link
     * transition.easing: the easing function ('ease-in', 'cubic-bezier(.01,.67,.83,1)', ...)
    */
    transition: {
      duration: 1000,
      delay: 1000,
      easing: 'ease',
      timeline: 'sequential', // or 'parallel'
      /** 
       * 'in' & 'out' object can have 'from' and/or 'to' object in it
       * inside 'from' and 'to' the object key/value pairs get rendered to
       * CSS Keyframes
       * 
      */
      in: {
        from: {
          backgroundColor: 'green', // CSS -> background-color: green;
          transform: 'translateY(-100%)' // CSS -> transform: translateY(-100%)
        },
        to: {
          backgroundColor: 'transparent',
          // transform is implicitly translateY(0) but i dont have to write that if it's the default visual ...
        }
      },
      out: {
        from: {
          color: 'brick'        
        },
        to: {
          color: 'var(--myVar)'
        }
      }
    }
  }
)

/**
 * using/calling this function is optional.
 * you can *overwrite* the global transition on a
 * given set of elements and appliying a custom
 * transition to all <element>, #id, .class selector
 * 
 * */

xref.animate('header', {
  duration: 500,
  delay: 500,
  easing: 'ease-in-out',
  timeline: 'parallel',
  in: {
    from: {
      backgroundColor: 'yellow', // CSS -> background-color: yellow;
      opacity: 0 // CSS -> opacity: 0
    },
    to: {
      backgroundColor: 'blue', // CSS -> background-color: blue;
      opacity: 1 // CSS -> opacity: 1
    }
  },
  out: {
    from: {
      backgroundColor: 'gray', // CSS -> background-color: gray;
      opacity: 0 // CSS -> opacity: 0
    },
    to: {
      backgroundColor: 'rgba(123, 231, 213, 0.4)', // CSS -> background-color: rgba(123, 231, 213, 0.4);
      opacity: 1 // CSS -> opacity: 1
    }
  }
})

const allMyButtons = document.querySelectorAll('button')

xref.animate(allMyButtons, {
  duration: 500,
  delay: 500,
  easing: 'ease-in-out',
  timeline: 'parallel',
  out: {
    from: {
      backgroundColor: 'yellow', // CSS -> background-color: yellow;
      opacity: 0, // CSS -> opacity: 0
      scale: 0.5
    },
    to: {
      backgroundColor: 'blue', // CSS -> background-color: blue;
      opacity: 1, // CSS -> opacity: 1
      scale: 1,
    }
  },
  in: {
    from: {
      backgroundColor: 'yellow', // CSS -> background-color: yellow;
      opacity: 0, // CSS -> opacity: 0
      scale: 0.5
    },
    to: {
      backgroundColor: 'blue', // CSS -> background-color: blue;
      opacity: 1, // CSS -> opacity: 1
      scale: 1,
    }
  }
})


```

## todo

- bug: transitioning set the head tags inside the <body> of the new page and doesnt overwrite the old
- bug: use history API to use bakc/forward button of browser -> animate and change the url!
- bug: prfetch event is not implemented
- test: install `jest` and setup test for all functions