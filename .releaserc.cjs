/**
 * semantic-release configuration — one release line, three channels.
 *
 *   dev  → 2.2.0-dev.1, 2.2.0-dev.2 …   npm dist-tag `dev`,  GitHub Pre-release
 *   stg  → 2.2.0-rc.1,  2.2.0-rc.2  …   npm dist-tag `rc`,   GitHub Pre-release
 *   main → 2.2.0                        npm dist-tag `latest`, GitHub Release
 *
 * Every version, tag, CHANGELOG.md entry and GitHub Release is derived from the Conventional
 * Commits since the last tag on that channel — nothing here is ever bumped by hand.
 *
 * Publishing to npm only happens when NPM_TOKEN is present. Without it the run still versions,
 * tags, writes the changelog and cuts the GitHub Release, so a fork or a repo that has not been
 * given a token yet gets the full pipeline minus the publish rather than a red build.
 *
 * The release commit carries `[skip actions]` and is pushed with GITHUB_TOKEN, which by design
 * does not trigger workflows — the bump cannot re-run CI or release itself in a loop.
 *
 * See docs/releases.md.
 */

const npmPublish = Boolean(process.env.NPM_TOKEN);

module.exports = {
  branches: [
    'main',
    { name: 'stg', prerelease: 'rc' },
    { name: 'dev', prerelease: 'dev' },
  ],
  plugins: [
    [
      '@semantic-release/commit-analyzer',
      {
        preset: 'conventionalcommits',
        // Kwami is past 1.0, so the defaults apply: `feat` → minor, `fix`/`perf` → patch,
        // a `BREAKING CHANGE` footer → major. `docs`, `test`, `ci` and `chore` release nothing
        // on their own; `build(deps)` does, because a shipped dependency bump reaches consumers.
        releaseRules: [
          { type: 'build', scope: 'deps', release: 'patch' },
          { type: 'refactor', release: 'patch' },
          { type: 'revert', release: 'patch' },
        ],
      },
    ],
    [
      '@semantic-release/release-notes-generator',
      {
        preset: 'conventionalcommits',
        presetConfig: {
          types: [
            { type: 'feat', section: 'Features' },
            { type: 'fix', section: 'Bug Fixes' },
            { type: 'perf', section: 'Performance' },
            { type: 'refactor', section: 'Refactoring' },
            { type: 'revert', section: 'Reverts' },
            { type: 'build', section: 'Build & Dependencies' },
            { type: 'docs', section: 'Documentation', hidden: true },
            { type: 'test', section: 'Tests', hidden: true },
            { type: 'ci', section: 'CI', hidden: true },
            { type: 'chore', section: 'Chores', hidden: true },
            { type: 'style', section: 'Styling', hidden: true },
          ],
        },
      },
    ],
    [
      '@semantic-release/changelog',
      {
        changelogFile: 'CHANGELOG.md',
        changelogTitle:
          '# Changelog\n\nAll notable changes to [Kwami](https://github.com/kwami-labs/kwami) are documented in this file.\n\nThe format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),\nand this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).\n\nNew releases are prepended by semantic-release from Conventional Commits. Historical\nentries below the automation baseline were reconstructed from git history.',
      },
    ],
    [
      '@semantic-release/npm',
      {
        npmPublish,
      },
    ],
    [
      '@semantic-release/git',
      {
        assets: ['CHANGELOG.md', 'package.json'],
        message: 'chore(release): ${nextRelease.version} [skip actions]\n\n${nextRelease.notes}',
      },
    ],
    '@semantic-release/github',
    [
      '@semantic-release/exec',
      {
        // After a stable release on `main`, put `stg` and `dev` back on the same version
        // baseline so they stop cutting prereleases of a version that already shipped and the
        // next promote PR stays merge-clean. No-ops on the prerelease channels.
        successCmd: 'node scripts/release/sync-branches.mjs',
      },
    ],
  ],
};
