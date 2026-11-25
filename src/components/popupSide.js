export function popupOpensUp(trigger, height) {
  const bounds = trigger.getBoundingClientRect();
  let top = 0;
  let bottom = window.innerHeight;
  for (
    let parent = trigger.parentElement;
    parent;
    parent = parent.parentElement
  ) {
    if (/(auto|scroll|hidden)/.test(getComputedStyle(parent).overflowY)) {
      const clip = parent.getBoundingClientRect();
      top = Math.max(top, clip.top);
      bottom = Math.min(bottom, clip.bottom);
    }
  }
  return (
    bottom - bounds.bottom < height && bounds.top - top > bottom - bounds.bottom
  );
}
