import test from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";

const ROOT_APP = path.resolve(__dirname, "..");

test("Accessibility: StudyQuestionnaire enforces minimum 44px touch targets", () => {
  const filePath = path.join(
    ROOT_APP,
    "app",
    "participant",
    "studies",
    "[id]",
    "StudyQuestionnaire.tsx"
  );
  assert.ok(fs.existsSync(filePath), "StudyQuestionnaire.tsx must exist");
  const content = fs.readFileSync(filePath, "utf8");

  // Verify WCAG 2.5.5 / 2.5.8 touch target threshold (min 44px)
  assert.ok(
    content.includes("min-h-[44px]"),
    "Question input choices and rating buttons must have min-h-[44px] touch target"
  );
  assert.ok(
    content.includes("min-w-[44px]"),
    "Scale/rating buttons must have min-w-[44px] touch target"
  );
});

test("Accessibility: StudyQuestionnaire has proper ARIA roles and live regions", () => {
  const filePath = path.join(
    ROOT_APP,
    "app",
    "participant",
    "studies",
    "[id]",
    "StudyQuestionnaire.tsx"
  );
  const content = fs.readFileSync(filePath, "utf8");

  // ARIA radiogroups & radios
  assert.ok(
    content.includes('role="radiogroup"'),
    "Single choice and rating scale must declare role='radiogroup'"
  );
  assert.ok(
    content.includes('role="radio"'),
    "Radio options must declare role='radio'"
  );
  assert.ok(
    content.includes("aria-checked="),
    "Selectable elements must declare aria-checked state"
  );

  // Screen reader announcements
  assert.ok(
    content.includes('aria-live="polite"'),
    "Component must include an aria-live='polite' region for announcements"
  );

  // Keyboard focus indicators
  assert.ok(
    content.includes("focus-visible:ring-2"),
    "Inputs and buttons must have visible focus rings for keyboard navigation"
  );
});

test("Accessibility: StudyConsentGate provides clear labels and affirmative controls", () => {
  const filePath = path.join(
    ROOT_APP,
    "app",
    "participant",
    "studies",
    "[id]",
    "StudyConsentGate.tsx"
  );
  assert.ok(fs.existsSync(filePath), "StudyConsentGate.tsx must exist");
  const content = fs.readFileSync(filePath, "utf8");

  // Checkboxes must not be pre-ticked
  assert.ok(
    content.includes("affirmVoluntary, setAffirmVoluntary] = useState(false)"),
    "Voluntary checkbox must default to false"
  );
  assert.ok(
    content.includes("affirmUnderstood, setAffirmUnderstood] = useState(false)"),
    "Understood checkbox must default to false"
  );

  // Affirmative consent controls
  assert.ok(
    content.includes('type="checkbox"'),
    "Consent gate must use affirmative checkboxes"
  );
});

test("Multilingual: All 5 Ethiopian language message files exist and match keys", () => {
  const messagesDir = path.join(ROOT_APP, "messages");
  const locales = ["en", "am", "om", "ti", "so"];

  for (const loc of locales) {
    const file = path.join(messagesDir, `${loc}.json`);
    assert.ok(fs.existsSync(file), `Message file for locale ${loc} must exist`);
    const data = JSON.parse(fs.readFileSync(file, "utf8"));
    assert.ok(data.common, `Locale ${loc} must have 'common' section`);
    assert.ok(data.study, `Locale ${loc} must have 'study' section`);
    assert.ok(data.consent, `Locale ${loc} must have 'consent' section`);
    assert.ok(data.credits, `Locale ${loc} must have 'credits' section`);
  }
});

test("Multilingual: Non-English locales are marked NEEDS_HUMAN_REVIEW and not shipped without certification", () => {
  const statusFile = path.join(ROOT_APP, "messages", "status.json");
  assert.ok(fs.existsSync(statusFile), "messages/status.json must exist");
  const statusData = JSON.parse(fs.readFileSync(statusFile, "utf8"));

  assert.equal(statusData.locales.en.status, "REVIEWED");
  assert.equal(statusData.locales.en.shippedInProduction, true);

  for (const loc of ["am", "om", "ti", "so"]) {
    assert.equal(
      statusData.locales[loc].status,
      "NEEDS_HUMAN_REVIEW",
      `Locale ${loc} must be marked NEEDS_HUMAN_REVIEW`
    );
    assert.equal(
      statusData.locales[loc].shippedInProduction,
      false,
      `Locale ${loc} must not be shipped in production until human-reviewed`
    );
  }
});

test("Ethiopic Typography: Noto Sans Ethiopic is configured in layout and CSS", () => {
  const layoutPath = path.join(ROOT_APP, "app", "layout.tsx");
  const layout = fs.readFileSync(layoutPath, "utf8");
  assert.ok(
    layout.includes("Noto+Sans+Ethiopic"),
    "layout.tsx must load Noto Sans Ethiopic from Google Fonts"
  );

  const cssPath = path.join(ROOT_APP, "app", "globals.css");
  const css = fs.readFileSync(cssPath, "utf8");
  assert.ok(
    css.includes("Noto Sans Ethiopic"),
    "globals.css must specify 'Noto Sans Ethiopic' in font fallback stacks"
  );
});
