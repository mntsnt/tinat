import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  isQuestionSkipped,
  getNextActiveStep,
  getPreviousActiveStep,
  createDefaultRoster,
  DEFAULT_STUDY_SKIP_RULES,
} from '../lib/studyLogic';

describe('Real-Time Logic Branching & Skip-Logic Engine', () => {
  const mockQuestions = Array.from({ length: 68 }, (_, i) => ({
    id: `q-${i + 1}`,
    order: i,
  }));

  it('skips Q19 (infant death cause) when Q18 (infant deaths) is 0', () => {
    // Q18 answered 0
    const answersZero = { 'q-18': 0 };
    const check1 = isQuestionSkipped(19, mockQuestions, answersZero);
    assert.strictEqual(check1.skipped, true);
    assert.match(check1.reason || '', /No infant deaths recorded/i);

    // Q18 answered 2
    const answersTwo = { 'q-18': 2 };
    const check2 = isQuestionSkipped(19, mockQuestions, answersTwo);
    assert.strictEqual(check2.skipped, false);
  });

  it('skips Q28 (unintended pregnancy) when Q27 (pregnancy) is "No"', () => {
    const answersNo = { 'q-27': 'No' };
    const checkNo = isQuestionSkipped(28, mockQuestions, answersNo);
    assert.strictEqual(checkNo.skipped, true);

    const answersYes = { 'q-27': 'Yes' };
    const checkYes = isQuestionSkipped(28, mockQuestions, answersYes);
    assert.strictEqual(checkYes.skipped, false);
  });

  it('skips latrine maintenance questions (Q60, Q61, Q62, Q63) when Q59 is "No latrine"', () => {
    const answersOpenField = { 'q-59': 'No latrine (Open field defecation)' };
    assert.strictEqual(isQuestionSkipped(60, mockQuestions, answersOpenField).skipped, true);
    assert.strictEqual(isQuestionSkipped(61, mockQuestions, answersOpenField).skipped, true);
    assert.strictEqual(isQuestionSkipped(62, mockQuestions, answersOpenField).skipped, true);
    assert.strictEqual(isQuestionSkipped(63, mockQuestions, answersOpenField).skipped, true);

    const answersPrivate = { 'q-59': 'Yes, private latrine in compound' };
    assert.strictEqual(isQuestionSkipped(60, mockQuestions, answersPrivate).skipped, false);
  });

  it('getNextActiveStep skips past skipped questions smoothly', () => {
    // Current step is index 17 (Q18: Infant deaths). If answer is 0, next step should skip index 18 (Q19) and jump directly to index 19 (Q20)
    const answers = { 'q-18': 0 };
    const nextStep = getNextActiveStep(17, mockQuestions, answers);
    assert.strictEqual(nextStep, 19); // 0-based index for Q20
  });

  it('getPreviousActiveStep skips backward over skipped questions smoothly', () => {
    // Current step is index 19 (Q20). If Q19 is skipped, moving back from Q20 should jump to index 17 (Q18)
    const answers = { 'q-18': 0 };
    const prevStep = getPreviousActiveStep(19, mockQuestions, answers);
    assert.strictEqual(prevStep, 17);
  });
});

describe('Dynamic Household Roster Generation', () => {
  it('creates valid default roster data structure matching family size', () => {
    const roster = createDefaultRoster(4);
    assert.strictEqual(roster.total, 4);
    assert.strictEqual(roster.members.length, 4);
    assert.strictEqual(roster.members[0].role, 'Household Head');
    assert.strictEqual(roster.members[1].role, 'Spouse');
    assert.strictEqual(roster.members[2].role, 'Child');
    assert.strictEqual(roster.maleCount + roster.femaleCount, 4);
  });

  it('bounds roster size safely between 1 and 25', () => {
    const zeroRoster = createDefaultRoster(0);
    assert.strictEqual(zeroRoster.total, 1);

    const hugeRoster = createDefaultRoster(100);
    assert.strictEqual(hugeRoster.total, 25);
  });
});
