import { useEffect, useState } from "react";

export default function AnimatedMessage({ fullText = "", onComplete, speed = 8, onProgress }) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!fullText) return;

    const prefersReduced =
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced) {
      setDisplayed(fullText);
      setDone(true);
      onProgress?.();
      onComplete?.(fullText);
      return;
    }

    let i = 0;
    let mounted = true;
    const baseSpeed = Math.max(3, Number(speed) || 8); // ms per character, clamped to a sensible minimum

    function step() {
      if (!mounted) return;
      i += 1;
      const current = fullText.slice(0, i);
      setDisplayed(current);
      // notify parent so it can keep the scroll anchored
      onProgress?.();

      if (i < fullText.length) {
        // small randomness to avoid mechanical rhythm
        const delay = baseSpeed + Math.random() * 10;
        setTimeout(step, delay);
      } else {
        setDone(true);
        onProgress?.();
        onComplete?.(fullText);
      }
    }

    step();

    return () => {
      mounted = false;
    };
  }, [fullText, onComplete, speed, onProgress]);

  return (
    <div className="message-bubble assistant animated">
      <span className="animated-text">{displayed}</span>
      {!done && <span className="typing-caret" aria-hidden="true" />}
    </div>
  );
}
