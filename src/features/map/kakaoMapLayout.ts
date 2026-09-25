import type { KakaoMapInstance } from './kakaoMapLoader';

export const observeKakaoMapLayout = (container: HTMLElement, map: KakaoMapInstance): (() => void) => {
  let previousWidth = 0;
  let previousHeight = 0;
  let frame: number | null = null;
  let disposed = false;

  const updateLayout = () => {
    frame = null;
    if (disposed) return;

    const width = container.clientWidth;
    const height = container.clientHeight;
    const changed = width !== previousWidth || height !== previousHeight;
    previousWidth = width;
    previousHeight = height;

    // Remember zero sizes so showing the same-sized map also relayouts.
    if (width > 0 && height > 0 && changed) map.relayout();
  };

  const scheduleLayout = () => {
    if (!disposed && frame === null) frame = window.requestAnimationFrame(updateLayout);
  };

  const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(scheduleLayout);
  observer?.observe(container);
  scheduleLayout();

  return () => {
    disposed = true;
    observer?.disconnect();
    if (frame !== null) window.cancelAnimationFrame(frame);
    frame = null;
  };
};
