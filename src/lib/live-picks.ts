/**
 * Cosa mostra la classifica delle scelte della giornata APERTA (quelle
 * delle giornate già chiuse sono nello Storico).
 *
 * Regola decisa con l'utente il 2026-09-11: le scelte sono di tutti,
 * subito, anche mentre la giornata è ancora aperta. C'era un interruttore
 * per nasconderle, tolto lo stesso giorno: si poteva aggirare (nascondi
 * tutta la settimana, scopri un attimo prima della scadenza, guarda,
 * cambia, rinascondi).
 */

export interface LivePickSlot {
  slotLabel: string;
  teamName: string;
}

export interface LivePickPlayer {
  playerId: string;
  aliveSlots: number;
  picks: LivePickSlot[];
}

export type LivePickVisibility =
  /** Fuori dal torneo: nessuno slot ancora vivo, niente da schierare. */
  | { kind: "out" }
  /** Nessuna scelta ancora fatta. */
  | { kind: "not-picked" }
  | { kind: "visible"; picks: LivePickSlot[] };

export function resolveLivePicks(
  players: LivePickPlayer[]
): Map<string, LivePickVisibility> {
  return new Map(
    players.map((player): [string, LivePickVisibility] => {
      if (player.aliveSlots === 0) return [player.playerId, { kind: "out" }];
      if (player.picks.length === 0) return [player.playerId, { kind: "not-picked" }];
      return [player.playerId, { kind: "visible", picks: player.picks }];
    })
  );
}
