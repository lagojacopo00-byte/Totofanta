"use client";

import { useState } from "react";
import { button, buttonGhost, input, label as labelClass } from "@/components/ui";

/** Un campo del profilo mostrato come testo (il valore attuale) + un
 * bottone "Modifica", invece di un input sempre aperto con "Salva":
 * meno rumoroso quando non si sta cambiando nulla, e il valore attuale
 * si legge subito senza doverlo dedurre da un placeholder. "Modifica"
 * rivela l'input precompilato col valore attuale + "Salva"/"Annulla". */
export function EditableField({
  fieldLabel,
  description,
  value,
  action,
  name,
  inputType = "text",
  minLength,
  big = false,
  startOpen = false,
}: {
  fieldLabel: string;
  description?: string;
  value: string;
  action: (formData: FormData) => void;
  name: string;
  inputType?: string;
  minLength?: number;
  /** Testo grande ed evidente invece della taglia normale: usato per il
   * nome pubblico, per chiarire subito che è quello che vedono gli altri. */
  big?: boolean;
  startOpen?: boolean;
}) {
  const [editing, setEditing] = useState(startOpen);

  return (
    <div className="flex flex-col gap-2">
      <label className={labelClass}>{fieldLabel}</label>
      {description ? (
        <p className="text-xs text-foreground-faint">{description}</p>
      ) : null}
      {editing ? (
        <form action={action} className="mt-1 flex flex-col gap-2 sm:flex-row">
          <input
            className={input}
            name={name}
            type={inputType}
            defaultValue={value}
            minLength={minLength}
            required
            autoFocus
          />
          <div className="flex gap-2">
            <button className={button} type="submit">
              Salva
            </button>
            <button
              type="button"
              className={buttonGhost}
              onClick={() => setEditing(false)}
            >
              Annulla
            </button>
          </div>
        </form>
      ) : (
        <div className="mt-1 flex items-center justify-between gap-3">
          <p
            className={
              big
                ? "truncate font-display text-3xl font-extrabold text-foreground"
                : "truncate text-sm text-foreground"
            }
          >
            {value}
          </p>
          <button
            type="button"
            className={`${buttonGhost} flex-none`}
            onClick={() => setEditing(true)}
          >
            Modifica
          </button>
        </div>
      )}
    </div>
  );
}
