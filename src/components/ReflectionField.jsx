import { useEffect, useRef } from "react";

export default function ReflectionField({ label, value, onChange, graded = false }) {
  const textareaRef = useRef(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return (
    <label className="field reflection-field">
      <span>
        {label}
        {graded && <span className="graded-badge">This is the graded part of Lab 1</span>}
      </span>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
      />
    </label>
  );
}
