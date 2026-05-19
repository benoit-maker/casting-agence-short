"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface InlineCastingNameProps {
  castingId: string;
  initialValue: string;
  className?: string;
}

export function InlineCastingName({ castingId, initialValue, className = "" }: InlineCastingNameProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(initialValue);
  const [saving, setSaving] = useState(false);
  const originalRef = useRef(initialValue);
  const router = useRouter();

  async function save() {
    const trimmed = value.trim();
    if (!trimmed || trimmed === originalRef.current) {
      setEditing(false);
      setValue(originalRef.current);
      return;
    }
    setSaving(true);
    const res = await fetch(`/api/castings/${castingId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_name: trimmed }),
    });
    setSaving(false);
    if (res.ok) {
      originalRef.current = trimmed;
      setValue(trimmed);
      router.refresh();
    } else {
      setValue(originalRef.current);
    }
    setEditing(false);
  }

  function cancel() {
    setValue(originalRef.current);
    setEditing(false);
  }

  if (editing) {
    return (
      <input
        autoFocus
        disabled={saving}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onFocus={(e) => e.target.select()}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === "Enter") { e.preventDefault(); save(); }
          if (e.key === "Escape") { e.preventDefault(); cancel(); }
        }}
        className={`${className} bg-transparent border-b border-primary outline-none w-full min-w-0`}
      />
    );
  }

  return (
    <span
      role="button"
      tabIndex={0}
      onClick={() => setEditing(true)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setEditing(true); }}
      title="Cliquer pour renommer"
      className={`${className} cursor-pointer rounded px-1 -mx-1 hover:bg-gray-100 transition-colors`}
    >
      {value}
    </span>
  );
}
