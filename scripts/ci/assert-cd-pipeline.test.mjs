import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const read = (relative) => readFileSync(new URL(`../../${relative}`, import.meta.url), 'utf8');

const cd = read('.github/workflows/cd.yml');
const release = read('.github/workflows/release.yml');
const channel = read('.github/workflows/release-channel.yml');

describe('the production CD pipeline', () => {
  it('runs after a green push to main, not on the prerelease channels', () => {
    assert.match(cd, /workflows:\s*\[ci\]/);
    assert.match(cd, /branches:\s*\[main\]/);
    assert.match(cd, /publish_latest:\s*true/);
    assert.doesNotMatch(cd, /branches:\s*\[[^\]]*(dev|stg)/);
  });

  it('delegates the release job to the shared channel workflow', () => {
    assert.match(cd, /uses:\s*\.\/\.github\/workflows\/release-channel\.yml/);
    assert.match(channel, /workflow_call/);
    assert.match(channel, /pnpm publish:latest/);
  });
});

describe('the prerelease workflow', () => {
  it('keeps main out so CD is the only stable publisher', () => {
    assert.match(release, /workflows:\s*\[ci\]/);
    assert.match(release, /branches:\s*\[dev, stg\]/);
    assert.doesNotMatch(release, /branches:\s*\[[^\]]*main/);
    assert.match(release, /uses:\s*\.\/\.github\/workflows\/release-channel\.yml/);
    assert.doesNotMatch(release, /publish_latest:\s*true/);
  });
});
