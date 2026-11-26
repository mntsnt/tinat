import test from "node:test";
import assert from "node:assert/strict";
import { singleMean, singleProportion, twoMeans, twoProportions } from "../lib/sampleSize";

test("single proportion uses z squared p times complement over margin squared", () => {
  const result = singleProportion(0.5, 0.05, 0.95);
  assert.equal(result.base, 385);
  assert.equal(result.value, 385);
  const withNonResponse = singleProportion(0.5, 0.05, 0.95, undefined, 10);
  assert.equal(withNonResponse.value, 428);
});

test("single proportion finite population correction reduces result", () => {
  const unlimited = singleProportion(0.5, 0.05, 0.95);
  const finite = singleProportion(0.5, 0.05, 0.95, 1000, 10);
  assert.ok(finite.value! < unlimited.value!);
});

test("single mean formula and nonresponse adjustment", () => {
  const result = singleMean(0, 10, 2, 0.95, undefined, 10);
  assert.equal(result.base, 97);
  assert.equal(result.value, 108);
});

test("two proportion and two mean formulas return positive planning totals", () => {
  assert.ok(twoProportions(0.5, 0.65, 0.8, 0.95).value! > 0);
  assert.ok(twoMeans(5, 10, 0.8, 0.95).value! > 0);
});
