/**
 * "Is there a page behind this one?" for back buttons.
 *
 * The three sites are separate origins, so a visitor often lands on a page from another
 * site (site navbar → app /prediction). A back button must return there, not to a
 * hard-coded page. It must also not be a dead button when nothing is behind the page
 * (opened from a bookmark or in a new tab): callers fall back to a fixed link then.
 */

/** The parts of `window` this module reads; narrow so it can be unit-tested. */
export interface HistoryWindow {
  history: { length: number };
  document: { referrer: string };
  /** Navigation API. Absent in older browsers. */
  navigation?: { currentEntry?: { index: number } | null };
}

export function hasPreviousPage(win: HistoryWindow): boolean {
  // A fresh tab holds only this page.
  if (win.history.length <= 1) return false;

  const index = win.navigation?.currentEntry?.index;
  // No Navigation API: the history length is all we know.
  if (typeof index !== "number" || index < 0) return true;
  // An earlier page of this site is behind us.
  if (index > 0) return true;
  // First page of this site in the tab. `history.length` also counts pages *ahead* of us
  // and unrelated pages the tab showed earlier, so only go back when a page linked here.
  return win.document.referrer !== "";
}
