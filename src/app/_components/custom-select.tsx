"use client";

import { useId, useEffect, useRef, useState } from "react";

/**
 * Headless listbox that looks like the site's text inputs. Replaces the
 * native `select` popup, which ignores the card styling entirely. Keyboard:
 * Enter/Space/ArrowDown opens, arrows move, Enter picks, Escape closes,
 * and focus never leaves the trigger, so tab order stays simple.
 */

// Mirrors `fieldClass` in search-form.tsx, so one input ruleset covers both.
const triggerClass =
  "flex w-full min-w-0 items-center justify-between gap-2 rounded-xl border border-neutral-300 bg-white px-4 py-3 text-left text-base text-neutral-900 transition hover:border-neutral-400 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/40 focus:outline-none sm:py-4 disabled:cursor-not-allowed disabled:bg-stone-50 disabled:text-stone-500";

export type SelectOption = {
  value: string;
  label: string;
  /** Rows that would de-sync the paired field (the same city from/to). */
  disabled?: boolean;
};

type CustomSelectProps = {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
};

export function CustomSelect({
  options,
  value,
  onChange,
  placeholder,
  disabled,
}: CustomSelectProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const selectedLabel = options.find((o) => o.value === value)?.label;

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  function openList() {
    if (disabled || options.length === 0) return;
    const current = options.findIndex((o) => o.value === value);
    const start = firstEnabled(current === -1 ? 0 : current, 1);
    if (start === -1) return;
    setActiveIndex(start);
    setOpen(true);
  }

  function firstEnabled(from: number, step: 1 | -1) {
    let index = from;
    while (index >= 0 && index < options.length) {
      if (!options[index]?.disabled) return index;
      index += step;
    }
    return -1;
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    if (disabled) return;
    if (!open) {
      if (event.key === "Enter" || event.key === " " || event.key === "ArrowDown") {
        event.preventDefault();
        openList();
      }
      return;
    }
    if (event.key === "Escape" || event.key === "Tab") {
      setOpen(false);
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => {
        const next = firstEnabled(i, 1);
        return next === -1 ? i : next;
      });
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => {
        const next = firstEnabled(i, -1);
        return next === -1 ? i : next;
      });
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      const option = options[activeIndex];
      if (option && !option.disabled) select(option.value);
    }
  }

  function select(next: string) {
    onChange(next);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="relative" onKeyDown={handleKeyDown}>
      <button
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? `${id}-listbox` : undefined}
        className={triggerClass}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openList())}
      >
        <span className={selectedLabel ? "" : "text-stone-500"}>
          {selectedLabel ?? placeholder}
        </span>
        {/* Caret flips while the list is open. */}
        <svg
          aria-hidden
          viewBox="0 0 12 12"
          className={`h-3 w-3 shrink-0 text-stone-500 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        >
          <path fill="currentColor" d="M2.3 4.5 6 8.2l3.7-3.7h-7.4Z" />
        </svg>
      </button>

      {open && (
        <ul
          id={`${id}-listbox`}
          role="listbox"
          aria-activedescendant={
            options[activeIndex] ? `${id}-option-${activeIndex}` : undefined
          }
          className="absolute z-20 mt-2 max-h-60 w-full overflow-auto rounded-xl border border-neutral-200 bg-white p-2 shadow-lg"
        >
          {options.map((option, index) => {
            const state = option.disabled
              ? "cursor-not-allowed text-stone-400"
              : "cursor-pointer text-neutral-900";
            return (
              <li
                key={option.value}
                id={`${id}-option-${index}`}
                role="option"
                aria-selected={option.value === value}
                aria-disabled={option.disabled ? true : undefined}
                className={`rounded-lg px-3 py-3 text-base ${
                  state
                } ${
                  activeIndex === index && !option.disabled ? "bg-stone-100" : ""
                } ${
                  option.value === value ? " font-semibold" : ""
                }`}
                onMouseEnter={() =>
                  !option.disabled && setActiveIndex(index)
                }
                onMouseDown={(event) => {
                  // Focus stays on the trigger instead of moving to the row.
                  event.preventDefault();
                }}
                onClick={() => {
                  if (!option.disabled) select(option.value);
                }}
              >
                {option.label}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
