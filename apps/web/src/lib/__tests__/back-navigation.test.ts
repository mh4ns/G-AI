import assert from "node:assert/strict";
import { test } from "node:test";
import { hasPreviousPage, type HistoryWindow } from "@g-ai/ui/history";

function win(length: number, referrer: string, index?: number): HistoryWindow {
  return {
    history: { length },
    document: { referrer },
    navigation: index === undefined ? undefined : { currentEntry: { index } },
  };
}

test("a fresh tab has nothing to go back to", () => {
  assert.equal(hasPreviousPage(win(1, "", 0)), false);
  // Opened in a new tab from a link: the referrer is set but the tab's history is empty.
  assert.equal(hasPreviousPage(win(1, "http://localhost:3001/", 0)), false);
});

test("an earlier page of the same site is a previous page", () => {
  assert.equal(hasPreviousPage(win(2, "", 1)), true);
});

test("arriving from another site goes back to it", () => {
  assert.equal(hasPreviousPage(win(2, "http://localhost:3001/", 0)), true);
});

test("the first page of the site with only pages ahead is not a previous page", () => {
  // Opened from a bookmark, moved on, then pressed the browser's back button.
  assert.equal(hasPreviousPage(win(2, "", 0)), false);
});

test("without the Navigation API the history length decides", () => {
  assert.equal(hasPreviousPage(win(2, "")), true);
  assert.equal(hasPreviousPage(win(1, "")), false);
});
