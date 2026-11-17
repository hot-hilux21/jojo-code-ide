import type { ReactNode } from "react";
import { useSpeakable } from "../hooks/useSpeakable";

export type ButtonVariant = "secondary" | "primary" | "toggle" | "small" | "danger";

interface AppButtonProps {
  label: string;
  onClick: () => void;
  children: ReactNode;
  variant?: ButtonVariant;
  icon?: ReactNode;
  disabled?: boolean;
  pressed?: boolean;
  hidden?: boolean;
  type?: "button" | "submit";
}

const variantClass: Record<ButtonVariant, string> = {
  secondary: "",
  primary: "btn-primary",
  toggle: "btn-toggle",
  small: "btn-small",
  danger: "btn-danger",
};

/** One button family for the whole React shell, with central speech. */
export function AppButton({
  label,
  onClick,
  children,
  variant = "secondary",
  icon,
  disabled = false,
  pressed,
  hidden = false,
  type = "button",
}: AppButtonProps) {
  const speakProps = useSpeakable(label);
  return (
    <button
      type={type}
      {...speakProps}
      className={`btn ${variantClass[variant]}`}
      onClick={onClick}
      disabled={disabled}
      hidden={hidden}
      aria-label={label}
      aria-pressed={pressed}
    >
      {icon ? <span className="btn-icon" aria-hidden="true">{icon}</span> : null}
      <span className="btn-label">{children}</span>
    </button>
  );
}
