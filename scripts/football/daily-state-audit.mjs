#!/usr/bin/env node
/**
 * Future Code Football Daily: READ-ONLY cross-repository production/live audit.
 * npm-free, no GitHub/Cloudflare write permission; no invented soccer data.
 * Usage: node scripts/football/daily-state-audit.mjs [output.json]
 * FOOTBALL_EXPECT_DATE=YYYY-MM-DD overrides current Asia/Yangon date.
 */
import { writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const sourceRepo = 'futurecode064-cyber/future-code-football-daily';
const productionRepo = 'futurecode064-cyber/AI-Recap-GitHub';
const productionBranch = 'football-daily-render';
const base = process.env.FOOTBALL_LIVE_ROOT || 'https://future-code-football-daily.pages.dev';
const date = process.env.FOOTBALL_EXPECT_DATE || new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Yangon', year: 'numeric', month: '2-digit', day: '2-digit'
}).format(new Date());
if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(date)) throw Error('FOOTBALL_EXPECT_DATE must be YYYY-MM-DD');
const report = { kind: 'future-code-daily-static-live-audit-v1', date, checkedAt: new Date().toISOString(),
  sourceRepo, productionRepo, productionBranch, root: base, errors: [], warnings: [], checks: {}, sites: {} };
const error = (s) => report.errors.push(s);
const warn = (s) => report.warnings.push(s);
const sha256 = (s) => createHash('sha256').update(s).digest('hex');

async function request(url) {
  const r = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(20000),
    headers: { 'User-Agent': 'future-code-daily-audit/1.0', Accept: 'application/json,text/plain,text/html,*/*' } });
  if (!r.ok) throw Error('HTTP ' + r.status + ' for ' + url);
  return r.text();
}
async function json(url) { return JSON.parse(await request(url)); }
async function head(repo, ref) {
  const j = await json('https://api.github.com/repos/' + repo + '/branches/' + encodeURIComponent(ref));
  if (!/^[a-f0-9]{40}$/.test(j.commit?.sha || '')) throw Error('Unknown git head: ' + repo + ':' + ref);
  return j.commit.sha;
}
async function raw(repo, revision, path) {
  return request('https://raw.githubusercontent.com/' + repo + '/' + revision + '/' + path);
}
async function optionalRaw(repo, revision, path) {
  try { return await raw(repo, revision, path); } catch (e) { warn('Unavailable repo file ' + path + ': ' + e.message); return null; }
}
const sitePaths = ['/', '/ykz-family/', '/bw-sport/', '/ko-thet-family/',
  '/future-code-journal/', '/kmm-sport-hub/'];
const previousDate = new Date(Date.parse(date + 'T00:00:00Z') - 86400000).toISOString().slice(0, 10);
try {
  const [sourceSha, productionSha] = await Promise.all([head(sourceRepo, 'main'), head(productionRepo, productionBranch)]);
  report.sourceHeadSha = sourceSha;
  report.productionHeadSha = productionSha;
  const [sourceText, productionText, engineText] = await Promise.all([
    raw(sourceRepo, sourceSha, 'football-daily/data/today.json'),
    raw(productionRepo, productionSha, 'football-daily/data/today.json'),
    raw(productionRepo, productionSha, 'football-daily/football-engine-config.js')
  ]);
  const sourceData = JSON.parse(sourceText);
  const productionData = JSON.parse(productionText);
  report.source = { reportDate: sourceData.reportDate, published: sourceData.published,
    count: sourceData.matches?.length ?? null };
  report.production = { reportDate: productionData.reportDate, published: productionData.published,
    count: productionData.matches?.length ?? null, contentSha256: sha256(productionText) };
  const found = engineText.match(/enabled\\s*:\\s*(true|false)/);
  report.engineReaderEnabled = found ? found[1] === 'true' : null;
  if (!found) error('Production engine reader status cannot be determined.');
  if (report.engineReaderEnabled === true)
    error('Production D1 reader is enabled: static audit cannot establish D1 live-data parity.');
  if (sourceData.reportDate !== productionData.reportDate)
    warn('Source and production report dates differ (' + sourceData.reportDate + ' / ' + productionData.reportDate + '): NEVER bulk-copy source over production.');
  if (productionData.reportDate !== date) error('Production reportDate is ' + productionData.reportDate + ', expected ' + date);
  if (productionData.published !== true) error('Production report is not marked published.');
  const rows = productionData.matches;
  if (!Array.isArray(rows)) error('Production matches must be an array.');
  else {
    if (!rows.length && (!Array.isArray(productionData.noFixturesLeagues) || !productionData.noFixturesLeagues.length))
      error('Empty fixtures without independently confirmed noFixturesLeagues.');
    const ids = new Set();
    const summary = { total: rows.length, previews: 0, specialChoice: 0,
      lastFiveBoth: 0, standingsBoth: 0, oneX2Complete: 0, logoAll: 0, myanmarOdds: 0 };
    for (const [i, m] of rows.entries()) {
      if (!m.fixtureId || ids.has(m.fixtureId)) error('Missing/duplicate fixtureId row ' + (i+1));
      ids.add(m.fixtureId);
      if (!m.home || !m.away || !m.homeDisplay || !m.awayDisplay || !m.league) error('Missing team/league identity row ' + (i+1));
      if (typeof m.dailyPreviewText === 'string' && m.dailyPreviewText.trim()) summary.previews++;
      if (m.specialChoiceRank || m.specialChoice === true) summary.specialChoice++;
      if (m.homeLastFive?.length === 5 && m.awayLastFive?.length === 5) summary.lastFiveBoth++;
      if (m.homeStanding?.points != null && m.awayStanding?.points != null) summary.standingsBoth++;
      if ([m.homeOdds, m.drawOdds, m.awayOdds].every(x => x != null && String(x).trim())) summary.oneX2Complete++;
      if (m.homeCrestUrl && m.awayCrestUrl && m.leagueLogoUrl) summary.logoAll++;
      if (m.myanmarOdds) summary.myanmarOdds++;
    }
    report.coverage = summary;
    if (summary.previews < rows.length) warn('Preview coverage incomplete: ' + summary.previews + '/' + rows.length);
    if (summary.lastFiveBoth < rows.length) warn('Last-five coverage incomplete: ' + summary.lastFiveBoth + '/' + rows.length);
    if (summary.oneX2Complete < rows.length) warn('1X2 coverage incomplete: ' + summary.oneX2Complete + '/' + rows.length);
    if (summary.logoAll < rows.length) warn('Team/league logo coverage incomplete: ' + summary.logoAll + '/' + rows.length);
  }
  const odds = await optionalRaw(productionRepo, productionSha, 'football-daily/data/odds/' + date + '.json');
  if (odds) {
    try { const sheet = JSON.parse(odds); report.odds = { exists: true, date: sheet.reportDate, sha256: sha256(odds) };
      if (sheet.reportDate !== date) error('Production dated odds JSON reportDate mismatch.');
    } catch (e) { error('Production dated odds is invalid JSON: ' + e.message); }
  } else report.odds = { exists: false };
  const archive = await optionalRaw(productionRepo, productionSha, 'football-daily/data/archive/' + previousDate + '.json');
  if (archive) {
    try { const prior = JSON.parse(archive); report.yesterday = { date: prior.reportDate,
      count: prior.matches?.length ?? null, completed: prior.matches?.filter(m => m.status === 'finished').length ?? null };
      if (prior.reportDate !== previousDate) error('Yesterday archive date does not match.');
    } catch (e) { error('Yesterday archive invalid JSON: ' + e.message); }
  }
  try {
    const liveText = await request(base + '/data/today.json?daily-audit=' + encodeURIComponent(productionSha.slice(0, 12)));
    const liveData = JSON.parse(liveText);
    report.live = { reportDate: liveData.reportDate, published: liveData.published,
      count: liveData.matches?.length ?? null, contentSha256: sha256(liveText) };
    const same = JSON.stringify(liveData) === JSON.stringify(productionData);
    report.checks.liveMatchesGitProduction = same;
    if (!same) error('LIVE /data/today.json does not match production branch JSON.');
    if (liveData.reportDate !== date) error('LIVE report is not the requested Yangon date.');
  } catch (e) { error('LIVE JSON readback not verified: ' + e.message); }
  await Promise.all(sitePaths.map(async (path) => {
    try {
      const html = await request(base + path);
      const ok = /<html[\\s>]/i.test(html) && /(?:app\\.js|football|ဘောလုံး)/i.test(html);
      report.sites[path] = { accessible: true, htmlLength: html.length, footballEntrypoint: ok };
      if (!ok) error('Unrecognized live football page at ' + path);
    } catch (e) { report.sites[path] = { accessible: false, reason: e.message }; error('LIVE route unverified ' + path); }
  }));
} catch (e) { error('Repository preflight failed: ' + e.message); }
report.visualPngQa = 'NOT TESTED: requires real browser PNG screenshot checks; HTTP alone cannot prove layout';
report.status = report.errors.length ? 'NOT LIVE VERIFIED' : 'STATIC LIVE DATA VERIFIED; VISUAL PNG NOT VERIFIED';
writeFileSync(process.argv[2] || 'football-daily-audit.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
if (report.errors.length) process.exitCode = 1;
