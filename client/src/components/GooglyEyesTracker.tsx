/* Sensory Garden Print: requestAnimationFrame interpolation turns pointer targets into smooth, bounded pupil motion. */
import { useEffect } from "react";
import { applyCharacterTheme, characters, loadCharacterTheme, type CharacterKey } from "@/lib/dailyContent";

export default function GooglyEyesTracker() {
  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const pageRoot = document.documentElement;
    let frame = 0;
    let idleTimer = 0;
    let sleepyTimer = 0;
    let lastFrameTime = performance.now();
    let pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    let targetsNeedUpdate = true;
    const pupils = new Map<HTMLElement, { x: number; y: number; targetX: number; targetY: number; follow: number }>();
    const defaultCharacter: CharacterKey = "momo";

    const syncPupils = () => {
      document.querySelectorAll<HTMLElement>("[data-googly-pupil]").forEach((pupil) => {
        if (!pupils.has(pupil)) pupils.set(pupil, { x: 0, y: 0, targetX: 0, targetY: 0, follow: characters[defaultCharacter].eye.follow });
      });
      pupils.forEach((_, pupil) => { if (!document.contains(pupil)) pupils.delete(pupil); });
    };

    const centerEyes = () => {
      syncPupils();
      pupils.forEach((state, pupil) => {
        state.x = 0;
        state.y = 0;
        state.targetX = 0;
        state.targetY = 0;
        pupil.style.transform = "translate3d(0, 0, 0)";
      });
    };

    const updateTargets = () => {
      syncPupils();
      pupils.forEach((state, pupil) => {
        const eye = pupil.parentElement;
        if (!eye) return;
        const host = pupil.closest<HTMLElement>("[data-character]");
        const characterKey = host?.dataset.character as CharacterKey | undefined;
        const profile = characters[characterKey && characterKey in characters ? characterKey : defaultCharacter].eye;
        const rect = eye.getBoundingClientRect();
        const horizontal = pointer.x - (rect.left + rect.width / 2);
        const vertical = pointer.y - (rect.top + rect.height / 2);
        const distance = Math.hypot(horizontal, vertical) || 1;
        const max = Math.max(2, Math.min(rect.width, rect.height) * profile.range);
        const phase = performance.now() / 1000 * profile.rhythm + rect.left * 0.02;
        state.follow = profile.follow;
        state.targetX = (horizontal / distance) * max + Math.sin(phase) * profile.wander;
        state.targetY = (vertical / distance) * max + Math.cos(phase * 1.23) * profile.wander;
      });
    };

    const animateEyes = (timestamp: number) => {
      const frameFactor = Math.min((timestamp - lastFrameTime) / 16.67, 2.5);
      lastFrameTime = timestamp;
      if (targetsNeedUpdate) { updateTargets(); targetsNeedUpdate = false; }
      let stillMoving = false;
      pupils.forEach((state, pupil) => {
        const easing = 1 - Math.pow(1 - state.follow, frameFactor);
        state.x += (state.targetX - state.x) * easing;
        state.y += (state.targetY - state.y) * easing;
        if (Math.abs(state.targetX - state.x) > 0.08 || Math.abs(state.targetY - state.y) > 0.08) stillMoving = true;
        pupil.style.transform = `translate3d(${state.x.toFixed(2)}px, ${state.y.toFixed(2)}px, 0)`;
      });
      frame = stillMoving || targetsNeedUpdate ? window.requestAnimationFrame(animateEyes) : 0;
    };

    const requestSmoothUpdate = () => {
      if (!frame) { lastFrameTime = performance.now(); frame = window.requestAnimationFrame(animateEyes); }
    };

    const resetCharacterState = () => {
      pageRoot.dataset.characterIdle = "false";
      pageRoot.dataset.characterSleepy = "false";
      window.clearTimeout(idleTimer);
      window.clearTimeout(sleepyTimer);
      if (!reducedMotion.matches) {
        idleTimer = window.setTimeout(() => { pageRoot.dataset.characterIdle = "true"; }, 3200);
        sleepyTimer = window.setTimeout(() => { pageRoot.dataset.characterSleepy = "true"; }, 9000);
      }
    };

    const trackPointer = (event: PointerEvent) => {
      if (reducedMotion.matches) return;
      resetCharacterState();
      pointer = { x: event.clientX, y: event.clientY };
      targetsNeedUpdate = true;
      requestSmoothUpdate();
    };

    const handleMotionPreference = () => {
      if (reducedMotion.matches) { centerEyes(); pageRoot.dataset.characterIdle = "false"; pageRoot.dataset.characterSleepy = "false"; }
      else { targetsNeedUpdate = true; requestSmoothUpdate(); resetCharacterState(); }
    };

    window.addEventListener("pointermove", trackPointer, { passive: true });
    window.addEventListener("pointerdown", trackPointer, { passive: true });
    window.addEventListener("blur", centerEyes);
    reducedMotion.addEventListener("change", handleMotionPreference);
    applyCharacterTheme(loadCharacterTheme());
    centerEyes();
    resetCharacterState();

    return () => {
      window.removeEventListener("pointermove", trackPointer);
      window.removeEventListener("pointerdown", trackPointer);
      window.removeEventListener("blur", centerEyes);
      reducedMotion.removeEventListener("change", handleMotionPreference);
      window.clearTimeout(idleTimer);
      window.clearTimeout(sleepyTimer);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
