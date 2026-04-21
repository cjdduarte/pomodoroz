export const useRippleEffect =
  () =>
  (
    e: React.MouseEvent<HTMLButtonElement>,
    ref: React.RefObject<HTMLButtonElement | null>,
    fnCallback: () => void
  ) => {
    e.preventDefault();

    const { current } = ref;

    const buttonStyles: React.CSSProperties = {
      position: "relative",
      overflow: "hidden",
    };

    if (current) Object.assign(current.style, buttonStyles);

    if (current) {
      const rect = current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const rippleEl = document.createElement("span");

      rippleEl.classList.add("ripple-hook");

      const rippleStyles: React.CSSProperties = {
        top: `${y}px`,
        left: `${x}px`,
      };

      Object.assign(rippleEl.style, rippleStyles);

      const customColor = current.getAttribute("color");
      if (customColor) {
        rippleEl.style.backgroundColor = customColor;
      }

      current.appendChild(rippleEl);

      setTimeout(() => {
        const parentEl = rippleEl.parentElement;
        if (parentEl) {
          parentEl.removeChild(rippleEl);
        }
      }, 1000);
    }

    if (fnCallback) {
      fnCallback();
    }
  };
