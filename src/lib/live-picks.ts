/**
 * Chi vede cosa, tra le scelte della giornata APERTA (quelle delle
 * giornate già chiuse sono di tutti, vedi lo Storico).
 *
 * Regole decise con l'utente il 2026-09-11:
 * - di default le scelte sono visibili a tutti, subito, anche mentre la
 *   giornata è ancora aperta;
 * - chi vuole può nasconderle (`hidePicks`), ma solo finché le scelte
 *   sono aperte: al primo calcio d'inizio si scoprono comunque;
 * - scambio onesto: chi nasconde le proprie non vede quelle degli altri.
 */

export interface LivePickSlot {
  slotLabel: string;
  teamName: string;
}

export interface LivePickPlayer {
  playerId: string;
  hidePicks: boolean;
  aliveSlots: number;
  picks: LivePickSlot[];
}

export type LivePickVisibility =
  /** Fuori dal torneo: nessuno slot ancora vivo, niente da schierare. */
  | { kind: "out" }
  /** Nessuna scelta ancora fatta (e nessun motivo per nasconderlo). */
  | { kind: "not-picked" }
  | { kind: "visible"; picks: LivePickSlot[] }
  /** `by: "them"` = le tiene nascoste lui; `by: "me"` = le tengo nascoste
   * io, quindi per reciprocità non vedo le sue. */
  | { kind: "hidden"; by: "them" | "me"; hasPicked: boolean };

export function resolveLivePicks({
  viewerPlayerId,
  viewerHidesPicks,
  pickingOpen,
  players,
}: {
  viewerPlayerId: string;
  viewerHidesPicks: boolean;
  /** false quando la finestra di scelta è già scaduta: da lì in poi le
   * scelte di tutti sono visibili, hide_picks incluso. */
  pickingOpen: boolean;
  players: LivePickPlayer[];
}): Map<string, LivePickVisibility> {
  return new Map(
    players.map((player): [string, LivePickVisibility] => {
      const hasPicked = player.picks.length > 0;
      const own: LivePickVisibility = hasPicked
        ? { kind: "visible", picks: player.picks }
        : { kind: "not-picked" };

      if (player.aliveSlots === 0) return [player.playerId, { kind: "out" }];

      // Le proprie scelte si vedono sempre, anche se nascoste agli altri;
      // a scelte chiuse si vedono quelle di tutti.
      if (player.playerId === viewerPlayerId || !pickingOpen) {
        return [player.playerId, own];
      }
      if (player.hidePicks) {
        return [player.playerId, { kind: "hidden", by: "them", hasPicked }];
      }
      if (viewerHidesPicks) {
        return [player.playerId, { kind: "hidden", by: "me", hasPicked }];
      }
      return [player.playerId, own];
    })
  );
}
