/**
 * Enforces Conventional Commits on every commit message, through the husky `commit-msg` hook
 * locally and the `commits` job in `.github/workflows/ci.yml` on every pull request.
 *
 * semantic-release derives the next version, the git tag, the GitHub Release and every
 * CHANGELOG.md entry from this history — a non-conventional subject is silently unreleasable
 * work. See docs/releases.md.
 *
 * Scopes are free-form, but the module names are the ones that read well in the changelog:
 * `avatar`, `agent`, `soul`, `memory`, `tools`, `skills`, `voice`, `build`, `ci`, `deps`.
 */
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // The published package is the deliverable, so the subject shows up verbatim in release
    // notes. Keep it readable rather than merely valid.
    'header-max-length': [2, 'always', 100],
    'body-max-line-length': [1, 'always', 100],
  },
};
