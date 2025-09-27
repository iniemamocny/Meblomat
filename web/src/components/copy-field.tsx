'use client';

import { useEffect, useRef, useState } from 'react';

type CopyFieldProps = {
  label: string;
  value: string;
};

export function CopyField({ label, value }: CopyFieldProps) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== undefined) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      if (timeoutRef.current !== undefined) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = window.setTimeout(() => {
        setCopied(false);
        timeoutRef.current = undefined;
      }, 2000);
    } catch (error) {
      console.error('Failed to copy link', error);
    }
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <code className="flex-1 truncate rounded-xl border border-white/10 bg-slate-950/60 px-4 py-2 text-sm text-slate-200">
        {value}
      </code>
      <button
        type="button"
        onClick={handleCopy}
        className="rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-100 transition hover:bg-emerald-500/20"
      >
        {copied ? 'Skopiowano!' : label}
      </button>
    </div>
  );
}
