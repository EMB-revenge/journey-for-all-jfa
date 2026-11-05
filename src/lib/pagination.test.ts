/**
 * Assert-style checks for src/lib/pagination.ts, the cursor math behind the
 * admin tables. Run with: npm run test
 */
import assert from "node:assert/strict";

import { pageOf } from "~/lib/pagination";

const row = (id: string) => ({ id });
const rows = Array.from({ length: 41 }, (_, index) => row(`b${index + 1}`));

// Page 1 returns rows 1..20 and points at row 20, not the extra row 21.
const first = pageOf(rows, 20);
assert.equal(first.items.length, 20);
assert.equal(first.items.at(-1)?.id, "b20");
assert.equal(first.nextCursor, "b20");

// The next query starts after row 20, so row 21 is the first row of page 2.
const second = pageOf(rows.slice(20), 20);
assert.equal(second.items[0]?.id, "b21", "row 21 must not be skipped");
assert.equal(second.items.length, 20);
assert.equal(second.nextCursor, "b40");

// Page 3 has the last row and no next cursor.
const third = pageOf(rows.slice(40), 20);
assert.equal(third.items.length, 1);
assert.equal(third.items[0]?.id, "b41");
assert.equal(third.nextCursor, undefined);

// A short page is the end.
assert.equal(pageOf(rows.slice(0, 20), 20).nextCursor, undefined);

console.log("pagination.test: all assertions passed");
