// Read-only VPN-free network compatibility preflight.
// This runs outside Myanmar and CANNOT prove Myanmar ISP access.
// Does not modify websites, DNS, Workers, Pages, databases or APKs.
import https from 'node:https';
import http2 from 'node:http2';
import { writeFileSync } from 'node:fs';

const timeoutMs = 12000;
const sites = [
  { name: 'Football Main', url: 'https://future-code-football-daily.pages.dev/', kind: 'page', required: true },
  { name: 'Goal Zone', url: 'https://future-code-football-daily.pages.dev/future-code-journal/', kind: 'page', required: true },
  { name: 'BW Sport', url: 'https://future-code-football-daily.pages.dev/bw-sport/', kind: 'page', required: true },
  { name: 'YKZ Family', url: 'https://future-code-football-daily.pages.dev/ykz-family/', kind: 'page', required: true },
  { name: 'Ko Thet Family', url: 'https://future-code-football-daily.pages.dev/ko-thet-family/', kind: 'page', required: true },
  { name: 'Football Worker API', url: 'https://future-code-football-engine.futurecode-dubai-86851bf2.workers.dev/api/football/manifest', kind: 'api', required: false },
  { name: 'Myanmar Kyar Health', url: 'https://myanmar-kyar.futurecode-dubai-86851bf2.workers.dev/health', kind: 'health', required: true },
  { name: 'Myanmar Kyar APK Downloads', url: 'https://futurecode064-cyber.github.io/AI-Recap-GitHub/myanmar-kyar/', kind: 'download-page', required: true }
];

function failure(error) {
  return { ok: false, error: String(error?.code || error?.message || error).slice(0, 200) };
}

function checkHttp1(url) {
  return new Promise(resolve => {
    const req = https.request(url, {
      method: 'GET',
      timeout: timeoutMs,
      headers: { 'user-agent': 'FutureCodeNetworkPreflight/1.0', accept: '*/*' },
      ALPNProtocols: ['http/1.1']
    }, res => {
      const status = res.statusCode || 0;
      const out = {
        ok: status >= 200 && status < 400,
        status,
        protocol: 'http/1.1',
        altSvc: String(res.headers['alt-svc'] || '').slice(0, 200),
        cfRay: String(res.headers['cf-ray'] || '').slice(0, 80)
      };
      res.resume();
      res.on('end', () => resolve(out));
      res.on('error', e => resolve(failure(e)));
    });
    req.on('timeout', () => req.destroy(new Error('timeout')));
    req.on('error', e => resolve(failure(e)));
    req.end();
  });
}

function checkHttp2(url) {
  return new Promise(resolve => {
    let settled = false;
    let session;
    let responseHeaders;
    const done = value => {
      if (settled) return;
      settled = true;
      resolve(value);
      if (session && !session.destroyed) session.destroy();
    };
    try {
      const u = new URL(url);
      session = http2.connect(u.origin, { timeout: timeoutMs, rejectUnauthorized: true });
      session.on('error', e => done(failure(e)));
      session.on('timeout', () => done(failure(new Error('timeout'))));
      session.on('connect', () => {
        if (session.alpnProtocol !== 'h2') {
          done(failure(new Error('HTTP/2 not negotiated; ALPN=' + session.alpnProtocol)));
          return;
        }
        const stream = session.request({
          ':method': 'GET',
          ':path': u.pathname + u.search,
          'user-agent': 'FutureCodeNetworkPreflight/1.0',
          accept: '*/*'
        });
        stream.on('response', headers => { responseHeaders = headers; });
        stream.on('data', () => {});
        stream.on('end', () => {
          const headers = responseHeaders || {};
          const status = Number(headers[':status'] || 0);
          done({
            ok: status >= 200 && status < 400,
            status,
            protocol: 'h2',
            altSvc: String(headers['alt-svc'] || '').slice(0, 200),
            cfRay: String(headers['cf-ray'] || '').slice(0, 80)
          });
        });
        stream.on('error', e => done(failure(e)));
        stream.end();
      });
    } catch (error) {
      done(failure(error));
    }
  });
}

const report = {
  purpose: 'vpn-free-compatibility-read-only-preflight',
  checkedAt: new Date().toISOString(),
  testLocation: 'GitHub Actions / machine running this script; NOT a Myanmar ISP test',
  limitations: [
    'HTTP/3/QUIC is not tested here; use Chrome or curl with HTTP/3 support from an affected network.',
    'Success outside Myanmar does not prove accessibility without VPN in Myanmar.',
    'Checking the download portal does not verify every APK/PNG/ZIP download.'
  ],
  productionModified: false,
  tests: []
};

for (const site of sites) {
  const [http1, http2Result] = await Promise.all([checkHttp1(site.url), checkHttp2(site.url)]);
  const test = {
    ...site, http1, http2: http2Result,
    passed: http1.ok && http2Result.ok
  };
  report.tests.push(test);
  console.log((test.passed ? 'PASS' : 'CHECK') + ' ' + site.name +
    ' h1=' + (http1.status ?? http1.error) +
    ' h2=' + (http2Result.status ?? http2Result.error));
}
report.requiredFailed = report.tests.filter(t => t.required && !t.passed).map(t => t.name);
report.result = report.requiredFailed.length ? 'needs-investigation' : 'external-network-pass';
writeFileSync('vpn-free-preflight-results.json', JSON.stringify(report, null, 2) + '\n', 'utf8');
console.log('Required failures: ' + (report.requiredFailed.join(', ') || 'none'));
if (report.requiredFailed.length) process.exitCode = 1;
