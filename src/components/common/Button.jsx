import Spinner from "@/components/common/Spinner.jsx";

import styles from "./Button.module.css";

/**
 * @param {{
 *   variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'link',
 *   size?: 'sm' | 'md',
 *   loading?: boolean,
 *   fullWidth?: boolean,
 *   type?: 'button' | 'submit' | 'reset',
 *   disabled?: boolean,
 *   onClick?: () => void,
 *   children: import('react').ReactNode,
 *   className?: string,
 * }} props
 */
export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  type = "button",
  disabled = false,
  onClick,
  children,
  className = "",
}) {
  const variantClass = styles[variant] ?? styles.primary;
  const sizeClass = size === "sm" ? styles.sm : "";

  return (
    <button
      type={type}
      className={[styles.root, variantClass, sizeClass, fullWidth ? styles.fullWidth : "", className]
        .filter(Boolean)
        .join(" ")}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading ? (
        <span className={styles.spinnerSlot} aria-hidden>
          <Spinner size="sm" />
        </span>
      ) : null}
      {children}
    </button>
  );
}
