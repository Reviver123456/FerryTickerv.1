"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { Check, ChevronDown, Languages } from "lucide-react";
import { LANGUAGE_OPTIONS, getLanguageLabel, type AppLanguage } from "@/lib/i18n";
import styles from "@/styles/components/LanguageSelector.module.css";

type LanguageSelectorProps = {
  className?: string;
  description?: string;
  label: string;
  language: AppLanguage;
  onChange: (language: AppLanguage) => void;
  selectedLabel: string;
  variant?: "default" | "compact";
};

export function LanguageSelector({
  className,
  description,
  label,
  language,
  onChange,
  selectedLabel,
  variant = "default",
}: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isCompact = variant === "compact";

  const activeOption = useMemo(
    () => LANGUAGE_OPTIONS.find((option) => option.value === language) ?? LANGUAGE_OPTIONS[0],
    [language],
  );
  const activeLabel = getLanguageLabel(activeOption.value, language);
  const showActiveNativeLabel = activeOption.nativeLabel !== activeLabel;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleFocusIn = (event: FocusEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("focusin", handleFocusIn);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("focusin", handleFocusIn);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className={clsx(styles.root, isCompact && styles.rootCompact, className)}>
      {!isCompact ? (
        <div className={styles.header}>
          <div className={styles.labelRow}>
            <Languages className={styles.labelIcon} />
            <span className={styles.label}>{label}</span>
          </div>
          {description ? <p className={styles.description}>{description}</p> : null}
        </div>
      ) : null}

      <button
        type="button"
        className={clsx(styles.trigger, isOpen && styles.triggerOpen, isCompact && styles.triggerCompact)}
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={`${label}: ${activeLabel}`}
      >
        {!isCompact ? (
          <div className={styles.triggerIconWrap}>
            <Languages className={styles.triggerIcon} />
          </div>
        ) : null}

        <div className={styles.triggerContent}>
          <span className={styles.triggerLabel}>{activeLabel}</span>
          {!isCompact && showActiveNativeLabel ? <span className={styles.triggerMeta}>{activeOption.nativeLabel}</span> : null}
        </div>

        {!isCompact ? <span className={styles.activeBadge}>{selectedLabel}</span> : null}
        <ChevronDown className={clsx(styles.triggerChevron, isOpen && styles.triggerChevronOpen)} />
      </button>

      {isOpen ? (
        <div className={clsx(styles.menu, isCompact && styles.menuCompact)} role="listbox" aria-label={label}>
          {LANGUAGE_OPTIONS.map((option) => {
            const isActive = option.value === language;
            const translatedLabel = getLanguageLabel(option.value, language);
            const showNativeLabel = option.nativeLabel !== translatedLabel;

            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isActive}
                className={clsx(styles.option, isActive && styles.optionActive)}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
              >
                <div className={styles.optionCopy}>
                  <span className={styles.optionLabel}>{translatedLabel}</span>
                  {showNativeLabel ? <span className={styles.optionMeta}>{option.nativeLabel}</span> : null}
                </div>

                <span className={clsx(styles.optionIndicator, isActive && styles.optionIndicatorActive)}>
                  {isActive ? <Check className={styles.optionIndicatorIcon} /> : null}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
