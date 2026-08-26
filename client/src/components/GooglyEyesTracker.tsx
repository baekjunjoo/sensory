/* Sensory Garden Print: pointer and touch movement drive only pupil transforms, keeping character art and layout stable. */
import { useEffect } from "react";

export default function GooglyEyesTracker() {
  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

    const centerEyes = () => {
      document.querySelectorAll<HTMLElement>("[data-googly-pupil]").forEach((pupil) => {
        pupil.style.transform = "translate3d(0, 0, 0)";
      });
    };

    const updateEyes = () => {
      frame = 0;
      document.querySelectorAll<HTMLElement>("[data-googly-pupil]").forEach((pupil) => {
        const eye = pupil.parentElement;
        if (!eye) return;
        const rect = eye.getBoundingClientRect();
        const horizontal = pointer.x - (rect.left + rect.width / 2);
        const vertical = pointer.y - (rect.top + rect.height / 2);
        const distance = Math.hypot(horizontal, vertical) || 1;
        const max = Math.max(2, Math.min(rect.width, rect.height) * 0.24);
        const moveX = (horizontal / distance) * max;
        const moveY = (vertical / distance) * max;
        pupil.style.transform = `translate3d(${moveX.toFixed(2)}px, ${moveY.toFixed(2)}px, 0)`;
      });
    };

    const trackPointer = (event: PointerEvent) => {
      if (reducedMotion.matches) return;
      pointer = { x: event.clientX, y: event.clientY };
      if (!frame) frame = window.requestAnimationFrame(updateEyes);
    };

    const handleMotionPreference = () => {
      if (reducedMotion.matches) centerEyes();
    };

    window.addEventListener("pointermove", trackPointer, { passive: true });
    window.addEventListener("pointerdown", trackPointer, { passive: true });
    window.addEventListener("blur", centerEyes);
    reducedMotion.addEventListener("change", handleMotionPreference);
    centerEyes();

    return () => {
      window.removeEventListener("pointermove", trackPointer);
      window.removeEventListener("pointerdown", trackPointer);
      window.removeEventListener("blur", centerEyes);
      reducedMotion.removeEventListener("change", handleMotionPreference);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
