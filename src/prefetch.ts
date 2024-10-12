/**
 * This file is used to prefetch data for the application.
 */

export function prefetch(options: { event: string; delay: number; active: boolean; callback: () => void | undefined }) {
  // create a function a prefetches a html page on a given options.event + delay
  // the set the <link prefetch> tag to the href of the page
  // then call the callback function
  // if the active is false, then return
  if (!options.active) return;

  const link = document.createElement("link");
  link.rel = "prefetch";
  link.href;
  link.addEventListener(options.event, () => {
    setTimeout(() => {
      
      document.head.appendChild(link);
      options.callback?.();
    }, options.delay);
  });

  document.head.appendChild(link);

  return link;
}
