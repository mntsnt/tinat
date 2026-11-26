import test from "node:test";
import assert from "node:assert/strict";
import {
  mean, median, mode, rangeAndIQR, varianceAndSD, proportion,
  relativeRisk, oddsRatio, absoluteRiskAndNNT, diagnosticAccuracy,
  chiSquare, correlation,
} from "../lib/statistics";

test("descriptive statistics calculate established values", () => {
  const values = [1, 2, 2, 4, 7];
  assert.equal(mean(values).value, 16 / 5);
  assert.equal(median(values).value, 2);
  assert.equal(mode(values).value, 2);
  const spread = rangeAndIQR(values);
  assert.equal(spread.range.value, 6);
  assert.equal(spread.iqr.value, 2);
  const variance = varianceAndSD(values);
  assert.equal(variance.variance.value, 5.7);
  assert.equal(variance.standardDeviation.value, Math.sqrt(5.7));
});

test("proportion returns count and denominator percentage", () => {
  const result = proportion(25, 100);
  assert.equal(result.value, 0.25);
  assert.match(result.interpretation, /25\.00%/);
});

test("relative risk, odds ratio and ARR/NNT use 2x2 table", () => {
  // Exposed: 20/100, unexposed: 10/100
  assert.equal(relativeRisk(20, 80, 10, 90).value, 2);
  assert.equal(oddsRatio(20, 80, 10, 90).value, 2.25);
  const arrNnt = absoluteRiskAndNNT(20, 80, 40, 60);
  assert.equal(arrNnt.arr.value, 0.2);
  assert.equal(arrNnt.nnt.value, 5);
});

test("diagnostic accuracy computes sensitivity specificity PPV and NPV", () => {
  const result = diagnosticAccuracy(90, 20, 10, 180);
  assert.equal(result.sensitivity.value, 0.9);
  assert.equal(result.specificity.value, 0.9);
  assert.ok(Math.abs(result.ppv.value! - 0.8181818181818182) < 1e-12);
  assert.equal(result.npv.value, 0.9473684210526315);
});

test("chi square equals established 2x2 result for a symmetric table", () => {
  assert.ok(Math.abs(chiSquare(30, 10, 10, 30).value! - 20) < 1e-12);
});

test("correlation computes positive and negative relationships", () => {
  assert.equal(correlation([1, 2, 3], [2, 4, 6]).value, 1);
  assert.equal(correlation([1, 2, 3], [6, 4, 2]).value, -1);
});
