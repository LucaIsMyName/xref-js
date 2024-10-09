# `xref`

```js
import xref from 'xref-js'

/**
 * xref() is the global function to call that 
 * turns an MPA into and SPA using the native browser 
 * viewTransiton() API!
 * 
 * prefetch: prefetches all internal Links 
 * (relative or absolute links) on the given event
 * default event: 'mouseover'
 * delay: [n]ms after the event happenedm default: 10
 * active: is the prefetch even active (it's opt-in!), default is false
 * 
 * transition:
 * 
*/
xref(
  {
    prefetch: {
      isActive: true,
      event: 'click',
      delay: 1000,
    },
    transition: {
      duration: 1000,
      delay: 1000,
      easing: 'ease',
      timeline: 'sequential', // or 'parallel'
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
 * you can overwrite the global transition on a
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