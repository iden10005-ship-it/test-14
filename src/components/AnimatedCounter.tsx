import React, { useEffect, useMemo, useRef, useState } from 'react';

interface AnimatedCounterProps {
  value: string;
  durationMs?: number;
  className?: string;
}

interface ParsedStat {
  prefix: string;
  target: number;
  decimals: number;
  useGrouping: boolean;
  suffix: string;
}

function parseNumericStat(raw: string): ParsedStat | null {
  const match = raw.match(/^([^0-9]*?)(\d[\d,]*(?:\.\d+)?)(.*)$/);
  if (!match) return null;

  const prefix = match[1];
  const rawNum = match[2];
  const suffix = match[3];
  const target = Number.parseFloat(rawNum.replace(/,/g, ''));
  if (!Number.isFinite(target)) return null;

  const decimalMatch = rawNum.match(/\.(\d+)/);
  const decimals = decimalMatch ? decimalMatch[1].length : 0;
  const useGrouping = rawNum.includes(',');

  return { prefix, target, decimals, useGrouping, suffix };
}

function formatStatNumber(num: number, decimals: number, useGrouping: boolean): string {
  const fixed = decimals > 0 ? num.toFixed(decimals) : String(Math.round(num));
  if (!useGrouping) return fixed;

  const [intPart, decPart] = fixed.split('.');
  const formattedInt = Number(intPart).toLocaleString('en-US');
  return decPart !== undefined ? `${formattedInt}.${decPart}` : formattedInt;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  durationMs = 1400,
  className,
}) => {
  const parsed = useMemo(() => parseNumericStat(value), [value]);
  const containerRef = useRef<HTMLSpanElement | null>(null);
  const [hasEntered, setHasEntered] = useState(false);
  const [displayText, setDisplayText] = useState<string>(() => {
    if (!parsed) return value;
    return `${parsed.prefix}${formatStatNumber(0, parsed.decimals, parsed.useGrouping)}${parsed.suffix}`;
  });

  useEffect(() => {
    if (!parsed) {
      setDisplayText(value);
      return;
    }

    if (typeof window === 'undefined') {
      setDisplayText(value);
      return;
    }

    const prefersReducedMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion || typeof IntersectionObserver === 'undefined') {
      setHasEntered(true);
      setDisplayText(value);
      return;
    }

    const node = containerRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setHasEntered(true);
            observer.disconnect();
            break;
          }
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [parsed, value]);

  useEffect(() => {
    if (!parsed) {
      setDisplayText(value);
      return;
    }

    if (!hasEntered) {
      setDisplayText(
        `${parsed.prefix}${formatStatNumber(0, parsed.decimals, parsed.useGrouping)}${parsed.suffix}`
      );
      return;
    }

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setDisplayText(value);
      return;
    }

    let rafId = 0;
    let startTime: number | null = null;

    const tick = (timestamp: number) => {
      if (startTime === null) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = parsed.target * eased;

      if (progress >= 1) {
        setDisplayText(value);
        return;
      }

      setDisplayText(
        `${parsed.prefix}${formatStatNumber(current, parsed.decimals, parsed.useGrouping)}${parsed.suffix}`
      );
      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [hasEntered, parsed, value, durationMs]);

  return (
    <span ref={containerRef} className={className}>
      {displayText}
    </span>
  );
};
