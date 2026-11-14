import { test } from "node:test";
import assert from "node:assert/strict";
import {
  formatCollectorAnswers,
  hasAnswer,
  hasRequiredAnswer,
} from "../lib/collectorAnswers";

test("required-answer checks handle zero and compound answers correctly", () => {
  assert.equal(hasAnswer(0), true);
  assert.equal(hasAnswer("  "), false);
  assert.equal(hasAnswer([]), false);
  assert.equal(hasAnswer([""]), false);
  assert.equal(hasAnswer({ row1: [], row2: ["yes"] }), true);
  assert.equal(hasRequiredAnswer({ row1: "yes" }, ["row1", "row2"]), false);
  assert.equal(hasRequiredAnswer({ row1: "yes", row2: "no" }, ["row1", "row2"]), true);
});

test("formats only answered questions and keeps numeric values numeric", () => {
  assert.deepEqual(
    formatCollectorAnswers({
      count: 0,
      text: " response ",
      choices: ["a", "b"],
      grid: { row1: "yes" },
      empty: "",
      noChoices: [],
    }),
    [
      { questionId: "count", textValue: null, numberValue: 0 },
      { questionId: "text", textValue: " response ", numberValue: null },
      { questionId: "choices", textValue: "[\"a\",\"b\"]", numberValue: null },
      { questionId: "grid", textValue: "{\"row1\":\"yes\"}", numberValue: null },
    ]
  );
});
