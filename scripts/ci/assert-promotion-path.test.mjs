import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { evaluatePromotion } from './assert-promotion-path.mjs';

const REPO = 'kwami-labs/kwami';
const TIP = 'a'.repeat(40);
const OTHER = 'b'.repeat(40);

/** A well-formed promotion, overridable field by field. */
function promotion(overrides = {}) {
  return {
    base: 'stg',
    head: 'dev',
    headSha: TIP,
    headRepo: REPO,
    baseRepo: REPO,
    tipSha: TIP,
    ...overrides,
  };
}

describe('feature branches into dev', () => {
  it('accepts any same-repo feature branch', () => {
    assert.deepEqual(
      evaluatePromotion(promotion({ base: 'dev', head: 'feat/avatar', tipSha: null })),
      { ok: true },
    );
  });

  it('accepts a fork — dev is where outside contributions land', () => {
    const result = evaluatePromotion(
      promotion({ base: 'dev', head: 'feat/avatar', headRepo: 'someone/kwami', tipSha: null }),
    );
    assert.equal(result.ok, true);
  });

  it('rejects a back-merge from stg', () => {
    const result = evaluatePromotion(promotion({ base: 'dev', head: 'stg', tipSha: null }));
    assert.equal(result.ok, false);
    assert.match(result.reason, /downstream of dev/);
  });

  it('rejects a back-merge from main', () => {
    const result = evaluatePromotion(promotion({ base: 'dev', head: 'main', tipSha: null }));
    assert.equal(result.ok, false);
    assert.match(result.reason, /downstream of dev/);
  });
});

describe('dev into stg', () => {
  it('accepts the current tip of dev from this repo', () => {
    assert.deepEqual(evaluatePromotion(promotion()), { ok: true });
  });

  it('rejects a feature branch that skips dev', () => {
    const result = evaluatePromotion(promotion({ head: 'feat/avatar' }));
    assert.equal(result.ok, false);
    assert.match(result.reason, /must come from dev/);
  });

  it('rejects a fork whose branch is also called dev', () => {
    const result = evaluatePromotion(promotion({ headRepo: 'someone/kwami' }));
    assert.equal(result.ok, false);
    assert.match(result.reason, /got fork 'someone\/kwami'/);
  });

  it('rejects a stale head — dev moved on while the PR sat open', () => {
    const result = evaluatePromotion(promotion({ headSha: OTHER }));
    assert.equal(result.ok, false);
    assert.match(result.reason, /current tip/);
  });

  it('rejects when the tip could not be resolved rather than waving it through', () => {
    const result = evaluatePromotion(promotion({ tipSha: null }));
    assert.equal(result.ok, false);
    assert.match(result.reason, /Could not resolve the tip/);
  });
});

describe('stg into main', () => {
  it('accepts the current tip of stg from this repo', () => {
    assert.deepEqual(evaluatePromotion(promotion({ base: 'main', head: 'stg' })), { ok: true });
  });

  it('rejects dev promoting straight to main', () => {
    const result = evaluatePromotion(promotion({ base: 'main', head: 'dev' }));
    assert.equal(result.ok, false);
    assert.match(result.reason, /must come from stg/);
  });

  it('rejects a hotfix branch straight into main', () => {
    const result = evaluatePromotion(promotion({ base: 'main', head: 'hotfix/urgent' }));
    assert.equal(result.ok, false);
    assert.match(result.reason, /must come from stg/);
  });
});

describe('input validation', () => {
  it('rejects an unexpected base branch', () => {
    const result = evaluatePromotion(promotion({ base: 'release/2.x', head: 'dev' }));
    assert.equal(result.ok, false);
    assert.match(result.reason, /Unexpected base branch/);
  });

  it('rejects missing inputs instead of defaulting to allow', () => {
    for (const field of ['base', 'head', 'headSha', 'headRepo', 'baseRepo']) {
      const result = evaluatePromotion(promotion({ [field]: '' }));
      assert.equal(result.ok, false, `empty ${field} should not pass`);
      assert.match(result.reason, /Missing BASE/);
    }
  });

  it('tolerates surrounding whitespace from the workflow env', () => {
    assert.deepEqual(
      evaluatePromotion(promotion({ base: ' stg ', head: ' dev ', headRepo: ` ${REPO} ` })),
      { ok: true },
    );
  });
});
