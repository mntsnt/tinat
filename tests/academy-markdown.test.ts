import test from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AcademyMarkdown } from "../app/academy/components/AcademyMarkdown";

test("renders Academy lesson emphasis and lists as formatted content", () => {
  const html = renderToStaticMarkup(
    createElement(AcademyMarkdown, {
      content: "Research is **planned**.\n\n* **Clinical practice:** patient care\n* **Research:** systematic inquiry",
    })
  );

  assert.match(html, /<strong>planned<\/strong>/);
  assert.match(html, /<ul>/);
  assert.match(html, /<strong>Clinical practice:<\/strong>/);
  assert.doesNotMatch(html, /\*\*/);
});

test("renders Academy lesson images with figure and responsive caption", () => {
  const html = renderToStaticMarkup(
    createElement(AcademyMarkdown, {
      content:
        '![Evidence Pyramid](/assets/academy/diagrams/diagram-evidence-pyramid.png "Figure 1.1: Evidence Pyramid")',
    })
  );

  assert.match(html, /<figure/);
  assert.match(html, /<img/);
  assert.match(html, /src="\/assets\/academy\/diagrams\/diagram-evidence-pyramid\.png"/);
  assert.match(html, /alt="Evidence Pyramid"/);
  assert.match(html, /<figcaption/);
  assert.match(html, /Figure 1\.1: Evidence Pyramid/);
});
