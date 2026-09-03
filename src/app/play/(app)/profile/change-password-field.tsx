"use client";

import { useState } from "react";
import { button, buttonGhost, input, label as labelClass } from "@/components/ui";

/** A differenza degli altri campi del profilo, la password non ha un
 * "valore attuale" mostrabile: niente card sempre visibile con un input
 * vuoto, solo un bottone che rivela il campo quando serve davvero
 * cambiarla. */
export function ChangePasswordField({
  action,
  error,
  saved,
}: {
  action: (formData: FormData) => void;
  error: string | null;
  saved: boolean;
}) {
  const [editing, setEditing] = useState(Boolean(error));

  if (!editing) {
    return (
      <div className="flex flex-col gap-2">
        {saved ? (
          <p className="text-sm text-accent">Password aggiornata.</p>
        ) : null}
        <button
          type="button"
          className={`${buttonGhost} self-start`}
          onClick={() => setEditing(true)}
        >
          Cambia password
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <label className={labelClass}>Nuova password</label>
      {error ? <p className="text-sm text-lose">{error}</p> : null}
      <form action={action} className="mt-1 flex flex-col gap-2 sm:flex-row">
        <input
          className={input}
          name="password"
          type="password"
          minLength={8}
          placeholder="Almeno 8 caratteri"
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
    </div>
  );
}
