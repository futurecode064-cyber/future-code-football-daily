import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { readiness } from './notification-readiness.mjs';

const date = '2026-10-30';
const report = { reportDate: date, published: true, matches: [
  { fixtureId: 'a', dailyPreviewText: 'preview', specialChoice: true, specialAnalysisParagraphs: ['choice'] },
  { fixtureId: 'b', dailyPreviewText: 'preview', specialChoice: true, specialAnalysisParagraphs: ['choice'] },
] };
const odds = { reportDate: date, matches: ['a', 'b'].map(fixtureId => ({ fixtureId, bodyOdds: '-70', goalTotalOdds: '2-30' })) };
const previous = { reportDate: '2026-10-29', published: true, matches: [{ status: 'finished', finalScore: '2-1', resultSourceUrl: 'https://example.org', resultVerifiedDate: date }] };
const evening = { reportDate: date, matches: [{ eveningBodyOdds: '-60', eveningGoalTotalOdds: '2-20' }] };
test('two slots require the complete publication bundle', () => {
  const input = { date, report, odds, previous, evening };
  assert.equal(readiness(input).morning.ready, true);
  assert.equal(readiness(input).evening.ready, true);
  assert.equal(readiness({ ...input, previous: { ...previous, matches: [{ ...previous.matches[0], status: 'scheduled' }] } }).ready, false);
  assert.equal(readiness({ ...input, evening: { ...evening, matches: [{ eveningBodyOdds: '', eveningGoalTotalOdds: '2-20' }] } }).evening.ready, false);
  assert.equal(readiness({ ...input, report: { ...report, matches: report.matches.slice(0, 1) } }).ready, false);
});
