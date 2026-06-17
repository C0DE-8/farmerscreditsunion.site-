import { useEffect, useRef, useState } from "react";
import { FiChevronDown } from "react-icons/fi";
import styles from "./CustomSelect.module.css";

export default function CustomSelect({ label, value, options, onChange }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const selected = options.find((option) => option.value === value) || options[0];

  useEffect(() => {
    const close = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };

    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <label className={styles.field}>
      {label}
      <div className={styles.select} ref={rootRef}>
        <button type="button" onClick={() => setOpen((current) => !current)}>
          <span>{selected?.label}</span>
          <FiChevronDown />
        </button>

        {open && (
          <div className={styles.menu}>
            {options.map((option) => (
              <button
                type="button"
                className={option.value === value ? styles.active : ""}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                key={option.value}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </label>
  );
}
