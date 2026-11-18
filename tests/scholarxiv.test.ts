import assert from "node:assert/strict";
import test from "node:test";
import { normalizeScholarXivPaper } from "../lib/scholarxiv";

test("normalizes ScholarXIV papers and constructs safe arXiv links", () => {
  const paper = normalizeScholarXivPaper({
    extractedID: "2401.01234v2",
    title: "  A Research Paper  ",
    summary: " An abstract ",
    authors: [" Author One ", "Author Two"],
    published: "2024-01-03T00:00:00Z",
    primaryCategory: "cs.CL",
    category: ["cs.CL", "cs.AI"],
    doi: "10.48550/arXiv.2401.01234",
    pdfLink: "https://not-arxiv.example/paper.pdf",
  });

  assert.deepEqual(paper, {
    arxivId: "2401.01234v2",
    title: "A Research Paper",
    abstract: "An abstract",
    authors: ["Author One", "Author Two"],
    publishedAt: "2024-01-03T00:00:00.000Z",
    primaryCategory: "cs.CL",
    categories: ["cs.CL", "cs.AI"],
    doi: "10.48550/arXiv.2401.01234",
    paperUrl: "https://arxiv.org/abs/2401.01234v2",
    pdfUrl: "https://arxiv.org/pdf/2401.01234v2",
  });
});

test("rejects malformed or non-arXiv paper identifiers", () => {
  assert.equal(
    normalizeScholarXivPaper({
      extractedID: "../somewhere",
      title: "A Paper",
      summary: "An abstract",
    }),
    null
  );
  assert.equal(
    normalizeScholarXivPaper({
      extractedID: "2401.01234",
      title: "",
      summary: "An abstract",
    }),
    null
  );
});

test("supports legacy arXiv identifiers without permitting path traversal", () => {
  const paper = normalizeScholarXivPaper({
    extractedID: "hep-th/9901001v1",
    title: "A Legacy Paper",
    summary: "An abstract",
  });

  assert.equal(paper?.paperUrl, "https://arxiv.org/abs/hep-th/9901001v1");
  assert.equal(paper?.pdfUrl, "https://arxiv.org/pdf/hep-th/9901001v1");
});
