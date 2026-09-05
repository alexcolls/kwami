import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { findUnresolvableSpecifiers } from './check-dts-resolution.mjs';

describe('findUnresolvableSpecifiers', () => {
  it('flags an extensionless sibling re-export', () => {
    assert.deepEqual(findUnresolvableSpecifiers(`export * from './Kwami';`), ['./Kwami']);
  });

  it('flags an extensionless deep relative import', () => {
    assert.deepEqual(findUnresolvableSpecifiers(`import { Soul } from '../soul/Soul';`), [
      '../soul/Soul',
    ]);
  });

  it('accepts the same specifier once it carries .js', () => {
    assert.deepEqual(findUnresolvableSpecifiers(`export * from './Kwami.js';`), []);
  });

  it('flags a directory import, which node16 also cannot resolve', () => {
    assert.deepEqual(findUnresolvableSpecifiers(`export * from './renderers';`), ['./renderers']);
  });

  it('accepts the explicit index form', () => {
    assert.deepEqual(findUnresolvableSpecifiers(`export * from './renderers/index.js';`), []);
  });

  // tsc inlines cross-file types as `import('./x').T` inside declarations, which resolve
  // exactly like a top-level import and fail the same way.
  it('flags the inline import() type form tsc emits', () => {
    assert.deepEqual(
      findUnresolvableSpecifiers(`declare const a: import('./types/index').AvatarConfig;`),
      ['./types/index'],
    );
  });

  it('ignores bare package specifiers, which are not our problem', () => {
    assert.deepEqual(findUnresolvableSpecifiers(`import { Scene } from 'three';`), []);
  });

  // An asset import is fine in src/ — the bundler resolves it — but in a *shipped declaration*
  // it asks the consumer for an ambient module this package does not publish.
  it('flags an asset specifier that leaked into a declaration', () => {
    assert.deepEqual(
      findUnresolvableSpecifiers(
        `import s from './shaders/vertex.glsl?raw';\nimport i from './bg.png';`,
      ),
      ['./shaders/vertex.glsl?raw', './bg.png'],
    );
  });

  it('accepts a relative .json specifier, which node16 does resolve', () => {
    assert.deepEqual(findUnresolvableSpecifiers(`import v from './version.json';`), []);
  });

  it('reports every offender, not just the first', () => {
    const source = `export * from './a';\nexport * from './b';\nexport * from './c.js';`;
    assert.deepEqual(findUnresolvableSpecifiers(source), ['./a', './b']);
  });

  it('finds nothing in an empty file', () => {
    assert.deepEqual(findUnresolvableSpecifiers(''), []);
  });
});
