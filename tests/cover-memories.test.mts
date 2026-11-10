import { strict as assert } from "node:assert";
import { test } from "node:test";
import { MAX_MEMORIES, keepLatestMemories } from "../lib/cover-memories.ts";

const memory = (id: string, savedAt: number) => ({ id, savedAt });

test("keeps the 3 newest versions, newest first, and reports the rest for deletion", () => {
  assert.equal(MAX_MEMORIES, 3);
  const { kept, dropped } = keepLatestMemories([memory("a", 1), memory("d", 4), memory("b", 2), memory("c", 3)]);
  assert.deepEqual(kept.map(m => m.id), ["d", "c", "b"]);
  assert.deepEqual(dropped.map(m => m.id), ["a"]);
});

test("keeps everything when there are 3 or fewer versions", () => {
  const { kept, dropped } = keepLatestMemories([memory("a", 1), memory("b", 2)]);
  assert.deepEqual(kept.map(m => m.id), ["b", "a"]);
  assert.deepEqual(dropped, []);
});
