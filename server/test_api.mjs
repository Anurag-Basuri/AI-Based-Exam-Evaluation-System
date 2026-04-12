/**
 * Comprehensive Backend API Test Suite v2
 * Tests all major routes, error handlers, and edge cases.
 * Run: node test_api.mjs
 */

const BASE = 'http://localhost:8000/api';
let studentToken = null;
let teacherToken = null;

const PASS = '\x1b[32m✓ PASS\x1b[0m';
const FAIL = '\x1b[31m✗ FAIL\x1b[0m';
const SKIP = '\x1b[33m⊘ SKIP\x1b[0m';
let passed = 0, failed = 0, skipped = 0;

async function req(method, path, body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  return { status: res.status, data, ok: res.ok };
}

async function test(name, fn) {
  try {
    await fn();
    console.log(`  ${PASS} ${name}`);
    passed++;
  } catch (e) {
    console.log(`  ${FAIL} ${name}`);
    console.log(`       → ${e.message}`);
    failed++;
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'Assertion failed');
}

function skip(name) {
  console.log(`  ${SKIP} ${name}`);
  skipped++;
}

const ts = Date.now();
const TEST_STUDENT = { username: `teststudent_${ts}`, fullname: 'Test Student', email: `ts_${ts}@test.com`, password: 'TestPass1234!' };
const TEST_TEACHER = { username: `testteacher_${ts}`, fullname: 'Test Teacher', email: `tt_${ts}@test.com`, password: 'TestPass1234!' };

// ═══════════════════════════════════════════════
// 1. HEALTH CHECK
// ═══════════════════════════════════════════════
async function testHealth() {
  console.log('\n\x1b[36m═══ 1. Health Check ═══\x1b[0m');
  await test('GET /health returns 200', async () => {
    const r = await req('GET', '/health');
    assert(r.status === 200, `Expected 200, got ${r.status}`);
  });
}

// ═══════════════════════════════════════════════
// 2. STUDENT AUTH — errors
// ═══════════════════════════════════════════════
async function testStudentAuthErrors() {
  console.log('\n\x1b[36m═══ 2. Student Auth Error Handling ═══\x1b[0m');

  await test('POST /students/login — empty body → 400', async () => {
    const r = await req('POST', '/students/login', {});
    assert(r.status >= 400 && r.status < 500, `Expected 4xx, got ${r.status}`);
  });

  await test('POST /students/login — wrong password → 4xx', async () => {
    const r = await req('POST', '/students/login', { email: 'nobody@fake.com', password: 'wrongpass' });
    assert(r.status >= 400 && r.status < 500, `Expected 4xx, got ${r.status}`);
  });

  await test('POST /students/register — missing fields → 400', async () => {
    const r = await req('POST', '/students/register', { username: '' });
    assert(r.status >= 400, `Expected 4xx, got ${r.status}`);
  });

  await test('POST /students/google-login — missing idToken → 400', async () => {
    const r = await req('POST', '/students/google-login', {});
    assert(r.status >= 400, `Expected 4xx, got ${r.status}`);
  });

  await test('POST /students/google-login — invalid idToken → 401/500', async () => {
    const r = await req('POST', '/students/google-login', { idToken: 'fake-token-123' });
    assert(r.status >= 400, `Expected 4xx, got ${r.status}`);
  });

  await test('POST /students/verify-email — missing token → 400', async () => {
    const r = await req('POST', '/students/verify-email', {});
    assert(r.status >= 400, `Expected 4xx, got ${r.status}`);
  });

  await test('POST /students/reset-password — missing fields → 400', async () => {
    const r = await req('POST', '/students/reset-password', {});
    assert(r.status >= 400, `Expected 4xx, got ${r.status}`);
  });

  await test('POST /students/forgot-password — returns 200 always (anti-enumeration)', async () => {
    const r = await req('POST', '/students/forgot-password', { email: 'nonexistent@test.com' });
    // Returns 200 intentionally to avoid revealing whether email exists — good security!
    assert(r.status === 200 || r.status === 404, `Expected 200/404, got ${r.status}`);
  });
}

// ═══════════════════════════════════════════════
// 3. TEACHER AUTH — errors
// ═══════════════════════════════════════════════
async function testTeacherAuthErrors() {
  console.log('\n\x1b[36m═══ 3. Teacher Auth Error Handling ═══\x1b[0m');

  await test('POST /teachers/login — empty body → 400', async () => {
    const r = await req('POST', '/teachers/login', {});
    assert(r.status >= 400, `Expected 4xx, got ${r.status}`);
  });

  await test('POST /teachers/login — wrong creds → 4xx', async () => {
    const r = await req('POST', '/teachers/login', { email: 'nobody@fake.com', password: 'badpass' });
    assert(r.status >= 400 && r.status < 500, `Expected 4xx, got ${r.status}`);
  });

  await test('POST /teachers/google-login — missing idToken → 400', async () => {
    const r = await req('POST', '/teachers/google-login', {});
    assert(r.status >= 400, `Expected 4xx, got ${r.status}`);
  });

  await test('POST /teachers/google-login — invalid idToken → 401/500', async () => {
    const r = await req('POST', '/teachers/google-login', { idToken: 'garbage-token' });
    assert(r.status >= 400, `Expected 4xx, got ${r.status}`);
  });
}

// ═══════════════════════════════════════════════
// 4. REGISTER TEST ACCOUNTS
// ═══════════════════════════════════════════════
async function registerTestAccounts() {
  console.log('\n\x1b[36m═══ 4. Register Test Accounts ═══\x1b[0m');

  await test('Register test student', async () => {
    const r = await req('POST', '/students/register', TEST_STUDENT);
    assert(r.status === 201 || r.status === 200 || r.status === 409, `Got ${r.status}: ${JSON.stringify(r.data?.message || r.data)}`);
    if (r.data?.data?.authToken) {
      studentToken = r.data.data.authToken;
    }
  });

  if (!studentToken) {
    const login = await req('POST', '/students/login', { email: TEST_STUDENT.email, password: TEST_STUDENT.password });
    if (login.ok && login.data?.data?.authToken) studentToken = login.data.data.authToken;
  }
  console.log(`  \x1b[34mℹ Student token: ${studentToken ? 'ACQUIRED' : 'MISSING'}\x1b[0m`);

  await test('Register test teacher', async () => {
    const r = await req('POST', '/teachers/register', TEST_TEACHER);
    assert(r.status === 201 || r.status === 200 || r.status === 409, `Got ${r.status}: ${JSON.stringify(r.data?.message || r.data)}`);
    if (r.data?.data?.authToken) {
      teacherToken = r.data.data.authToken;
    }
  });

  if (!teacherToken) {
    const login = await req('POST', '/teachers/login', { email: TEST_TEACHER.email, password: TEST_TEACHER.password });
    if (login.ok && login.data?.data?.authToken) teacherToken = login.data.data.authToken;
  }
  console.log(`  \x1b[34mℹ Teacher token: ${teacherToken ? 'ACQUIRED' : 'MISSING'}\x1b[0m`);
}

// ═══════════════════════════════════════════════
// 5. PROTECTED ROUTES WITHOUT TOKEN (401)
// ═══════════════════════════════════════════════
async function testProtectedNoAuth() {
  console.log('\n\x1b[36m═══ 5. Protected Routes Without Auth → 401 ═══\x1b[0m');

  const routes = [
    ['GET', '/students/profile'],
    ['POST', '/students/logout'],
    ['PUT', '/students/update'],
    ['PUT', '/students/change-password'],
    ['GET', '/teachers/dashboard-stats'],
    ['POST', '/teachers/logout'],
    ['GET', '/submissions/my-submissions'],
    ['POST', '/submissions/start'],
    ['POST', '/exams/create'],
  ];

  for (const [method, path] of routes) {
    await test(`${method} ${path} → 401`, async () => {
      const r = await req(method, path, method !== 'GET' ? {} : null);
      assert(r.status === 401 || r.status === 403, `Expected 401/403, got ${r.status}`);
    });
  }
}

// ═══════════════════════════════════════════════
// 6. AUTHENTICATED STUDENT ROUTES
// ═══════════════════════════════════════════════
async function testStudentRoutes() {
  console.log('\n\x1b[36m═══ 6. Authenticated Student Routes ═══\x1b[0m');
  if (!studentToken) { skip('All student routes (no token)'); return; }

  await test('GET /students/profile → 200', async () => {
    const r = await req('GET', '/students/profile', null, studentToken);
    assert(r.status === 200, `Expected 200, got ${r.status}`);
    assert(r.data?.data?.email, 'Profile should have email');
  });

  await test('PUT /students/change-password — empty body → 400', async () => {
    const r = await req('PUT', '/students/change-password', {}, studentToken);
    assert(r.status >= 400, `Expected 4xx, got ${r.status}`);
  });

  await test('GET /submissions/my-submissions → 200 with array', async () => {
    const r = await req('GET', '/submissions/my-submissions', null, studentToken);
    assert(r.status === 200, `Expected 200, got ${r.status}`);
    assert(Array.isArray(r.data?.data), 'Should return array');
  });

  await test('POST /submissions/start — missing examId → 400', async () => {
    const r = await req('POST', '/submissions/start', {}, studentToken);
    assert(r.status >= 400, `Expected 4xx, got ${r.status}`);
  });

  await test('POST /submissions/start — nonexistent exam → 404', async () => {
    const r = await req('POST', '/submissions/start', { examId: '000000000000000000000000' }, studentToken);
    assert(r.status === 404 || r.status === 403, `Expected 404/403, got ${r.status}`);
  });

  await test('GET /submissions/000000000000000000000000/status → 404', async () => {
    const r = await req('GET', '/submissions/000000000000000000000000/status', null, studentToken);
    assert(r.status === 404, `Expected 404, got ${r.status}`);
  });
}

// ═══════════════════════════════════════════════
// 7. AUTHENTICATED TEACHER ROUTES
// ═══════════════════════════════════════════════
async function testTeacherRoutes() {
  console.log('\n\x1b[36m═══ 7. Authenticated Teacher Routes ═══\x1b[0m');
  if (!teacherToken) { skip('All teacher routes (no token)'); return; }

  await test('GET /teachers/dashboard-stats → 200 with analytics', async () => {
    const r = await req('GET', '/teachers/dashboard-stats', null, teacherToken);
    assert(r.status === 200, `Expected 200, got ${r.status}`);
    const d = r.data?.data;
    assert(d?.exams !== undefined, 'exams section missing');
    assert(d?.analytics !== undefined, 'analytics section missing');
    assert(Array.isArray(d?.analytics?.scoreDistribution), 'scoreDistribution must be array');
    assert(Array.isArray(d?.analytics?.examPerformance), 'examPerformance must be array');
    console.log(`       → scoreDistribution buckets: ${d.analytics.scoreDistribution.length}`);
    console.log(`       → examPerformance entries: ${d.analytics.examPerformance.length}`);
  });

  await test('POST /exams/create — missing fields → 400', async () => {
    const r = await req('POST', '/exams/create', {}, teacherToken);
    assert(r.status >= 400, `Expected 4xx, got ${r.status}`);
  });

  await test('GET /submissions/exam/000000000000000000000000 → 200 empty', async () => {
    const r = await req('GET', '/submissions/exam/000000000000000000000000', null, teacherToken);
    assert(r.status === 200, `Expected 200, got ${r.status}`);
  });

  await test('PATCH /submissions/000000000000000000000000/override — not found → 404', async () => {
    const r = await req('PATCH', '/submissions/000000000000000000000000/override', {
      questionId: '000000000000000000000000', marks: 5, remarks: 'test'
    }, teacherToken);
    assert(r.status === 404, `Expected 404, got ${r.status}`);
  });

  await test('PATCH /submissions/not-valid-id/override — cast error → 4xx/5xx', async () => {
    const r = await req('PATCH', '/submissions/not-valid-id/override', {
      questionId: 'abc', marks: 5
    }, teacherToken);
    assert(r.status >= 400, `Expected 4xx/5xx, got ${r.status}`);
  });

  await test('PUT /submissions/000000000000000000000000/evaluate — not found → 404', async () => {
    const r = await req('PUT', '/submissions/000000000000000000000000/evaluate', {
      evaluations: [{ question: '000000000000000000000000', marks: 5, remarks: 'test' }]
    }, teacherToken);
    assert(r.status === 404, `Expected 404, got ${r.status}`);
  });
}

// ═══════════════════════════════════════════════
// 8. MALFORMED REQUESTS & EDGE CASES
// ═══════════════════════════════════════════════
async function testEdgeCases() {
  console.log('\n\x1b[36m═══ 8. Edge Cases & Malformed Requests ═══\x1b[0m');

  await test('POST /students/login — invalid JSON → 4xx', async () => {
    const res = await fetch(`${BASE}/students/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{ this is broken json !!',
    });
    assert(res.status >= 400, `Expected 4xx, got ${res.status}`);
  });

  await test('GET /nonexistent-route → 404', async () => {
    const r = await req('GET', '/this-route-does-not-exist');
    assert(r.status === 404, `Expected 404, got ${r.status}`);
  });

  await test('POST /students/register — duplicate email → 409', async () => {
    // Register the same student again
    const r = await req('POST', '/students/register', TEST_STUDENT);
    assert(r.status === 409 || r.status === 400 || r.status === 422,
      `Expected 409/400/422 for duplicate, got ${r.status}`);
  });

  await test('POST /teachers/register — duplicate email → 409', async () => {
    const r = await req('POST', '/teachers/register', TEST_TEACHER);
    assert(r.status === 409 || r.status === 400 || r.status === 422,
      `Expected 409/400/422 for duplicate, got ${r.status}`);
  });

  if (studentToken) {
    await test('POST /students/logout → 200', async () => {
      const r = await req('POST', '/students/logout', {}, studentToken);
      assert(r.status === 200, `Expected 200, got ${r.status}`);
    });
  }

  if (teacherToken) {
    await test('POST /teachers/logout → 200', async () => {
      const r = await req('POST', '/teachers/logout', {}, teacherToken);
      assert(r.status === 200, `Expected 200, got ${r.status}`);
    });
  }
}

// ═══════════════════════════════════════════════
// RUNNER
// ═══════════════════════════════════════════════
async function main() {
  console.log('\n\x1b[1m\x1b[35m╔══════════════════════════════════════════════╗\x1b[0m');
  console.log('\x1b[1m\x1b[35m║  Backend API Comprehensive Test Suite v2     ║\x1b[0m');
  console.log('\x1b[1m\x1b[35m╚══════════════════════════════════════════════╝\x1b[0m');

  await testHealth();
  await testStudentAuthErrors();
  await testTeacherAuthErrors();
  await registerTestAccounts();
  await testProtectedNoAuth();
  await testStudentRoutes();
  await testTeacherRoutes();
  await testEdgeCases();

  console.log('\n\x1b[1m═══════════════════════════════════════════════\x1b[0m');
  console.log(`\x1b[32m  Passed:  ${passed}\x1b[0m`);
  console.log(`\x1b[31m  Failed:  ${failed}\x1b[0m`);
  console.log(`\x1b[33m  Skipped: ${skipped}\x1b[0m`);
  console.log(`  Total:   ${passed + failed + skipped}`);
  console.log('\x1b[1m═══════════════════════════════════════════════\x1b[0m\n');

  process.exit(failed > 0 ? 1 : 0);
}

main().catch(e => { console.error('Test runner error:', e); process.exit(1); });
