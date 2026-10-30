/** Publication gate shared by the two daily football notification slots. */
export function readiness({ date, report, odds, previous, evening }) {
  const fail = reason => ({ ready: false, reason });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return fail('date');
  if (report?.reportDate !== date || report.published !== true || !Array.isArray(report.matches) || !report.matches.length) return fail('report');
  if (odds?.reportDate !== date || !Array.isArray(odds.matches) || !odds.matches.length) return fail('morning odds');
  const eligible = odds.matches.filter(m => m.eligibleForPreview !== false);
  if (!eligible.length || eligible.some(o => !o.fixtureId || !o.bodyOdds?.trim() || !o.goalTotalOdds?.trim() ||
    !report.matches.some(m => m.fixtureId === o.fixtureId && m.dailyPreviewText?.trim()))) return fail('fixtures, previews or odds');
  if (report.matches.filter(m => m.specialChoice && m.specialAnalysisParagraphs?.length).length < 2) return fail('Special Choice');
  const yesterday = new Date(Date.parse(date + 'T12:00:00Z') - 86400000).toISOString().slice(0, 10);
  if (previous?.reportDate !== yesterday || previous.published !== true || !Array.isArray(previous.matches) ||
      previous.matches.some(m => m.status !== 'finished' || !/^\d+[-:]\d+$/.test(m.finalScore || '') || !m.resultSourceUrl || !m.resultVerifiedDate)) return fail('yesterday results');
  const morning = { ready: true, slot: 'morning', date };
  const rows = evening?.reportDate === date && Array.isArray(evening.matches) ? evening.matches : [];
  const current = rows.length > 0 && rows.every(m => m.eveningBodyOdds?.trim() && m.eveningGoalTotalOdds?.trim());
  return { morning, evening: current ? { ready: true, slot: 'evening', date } : fail('current odds') };
}
