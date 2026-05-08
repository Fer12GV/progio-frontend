import { forwardRef, useId } from "react";

import styles from "./Input.module.css";

/**
 * @param {{
 *   id?: string,
 *   label: string,
 *   error?: string,
 *   hint?: string,
 *   className?: string,
 * } & import('react').InputHTMLAttributes<HTMLInputElement>} props
 */
const Input = forwardRef(function Input({ id, label, error, hint, className = "", ...rest }, ref) {
  const uid = useId();
  const inputId = id ?? uid;
  const describedBy =
    [hint ? `${inputId}-hint` : "", error ? `${inputId}-err` : ""].filter(Boolean).join(" ") || undefined;

  return (
    <div className={[styles.wrap, className].filter(Boolean).join(" ")}>
      <label className={styles.label} htmlFor={inputId}>
        {label}
      </label>
      <input
        ref={ref}
        id={inputId}
        className={[styles.field, error ? styles.fieldError : ""].filter(Boolean).join(" ")}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        {...rest}
      />
      {hint ? (
        <p id={`${inputId}-hint`} className={styles.hint}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${inputId}-err`} className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
});

export default Input;
