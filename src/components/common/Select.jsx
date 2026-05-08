import { forwardRef, useId } from "react";

import styles from "./Select.module.css";

/**
 * Select nativo; `children` deben ser elementos `<option>`.
 *
 * @param {{
 *   id?: string,
 *   label: string,
 *   error?: string,
 *   hint?: string,
 *   className?: string,
 *   children: import('react').ReactNode,
 * } & Omit<import('react').SelectHTMLAttributes<HTMLSelectElement>, 'children'>} props
 */
const Select = forwardRef(function Select({ id, label, error, hint, className = "", children, ...rest }, ref) {
  const uid = useId();
  const selectId = id ?? uid;
  const describedBy =
    [hint ? `${selectId}-hint` : "", error ? `${selectId}-err` : ""].filter(Boolean).join(" ") || undefined;

  return (
    <div className={[styles.wrap, className].filter(Boolean).join(" ")}>
      <label className={styles.label} htmlFor={selectId}>
        {label}
      </label>
      <select
        ref={ref}
        id={selectId}
        className={[styles.select, error ? styles.selectError : ""].filter(Boolean).join(" ")}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        {...rest}
      >
        {children}
      </select>
      {hint ? (
        <p id={`${selectId}-hint`} className={styles.hint}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${selectId}-err`} className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
});

export default Select;
