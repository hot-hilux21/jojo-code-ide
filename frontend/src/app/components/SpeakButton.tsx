import type { ReactNode } from "react";
import { useSpeakable } from "../hooks/useSpeakable";

interface SpeakButtonProps {
  label: string;
  className: string;
  onClick: () => void;
  children: ReactNode;
  disabled?: boolean;
  pressed?: boolean;
  hidden?: boolean;
}

/** A native button wired to the central speech engine. */
export function SpeakButton({
  label,
  className,
  onClick,
  children,
  disabled = false,
  pressed,
  hidden = false,
}: SpeakButtonProps) {
  const speakProps = useSpeakable(label);
  return (
    <button
      type="button"
      className={className}
      onClick={onClick}
      disabled={disabled}
      hidden={hidden}
      aria-label={label}
      aria-pressed={pressed}
      {...speakProps}
    >
      {children}
    </button>
  );
}
