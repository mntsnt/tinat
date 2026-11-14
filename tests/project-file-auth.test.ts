import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { canUpdateProjectFile } from "../lib/projects/auth";

describe("Project file sensitivity permissions", () => {
  const researchAssistant = {
    canAccessHealthData: false,
    canManageProject: false,
  };
  const dataAnalyst = {
    canAccessHealthData: true,
    canManageProject: false,
  };
  const projectManager = {
    canAccessHealthData: true,
    canManageProject: true,
  };

  test("research assistants cannot update sensitive files or change sensitivity", () => {
    assert.equal(canUpdateProjectFile(researchAssistant, true, undefined), false);
    assert.equal(canUpdateProjectFile(researchAssistant, false, true), false);
    assert.equal(canUpdateProjectFile(researchAssistant, false, false), false);
  });

  test("data analysts can update sensitive files but cannot change sensitivity", () => {
    assert.equal(canUpdateProjectFile(dataAnalyst, true, undefined), true);
    assert.equal(canUpdateProjectFile(dataAnalyst, false, true), false);
  });

  test("project managers can update files and sensitivity status", () => {
    assert.equal(canUpdateProjectFile(projectManager, true, false), true);
  });
});
