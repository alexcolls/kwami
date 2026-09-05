// GLSL shader modules for Vite/bundler
declare module '*.glsl?raw' {
  const shader: string
  export default shader
}

declare module '*.glsl' {
  const shader: string
  export default shader
}

// Image/texture modules
declare module '*.jpeg' {
  const url: string
  export default url
}

declare module '*.jpg' {
  const url: string
  export default url
}

declare module '*.png' {
  const url: string
  export default url
}

/**
 * The package version, substituted at build time by Vite's `define` (see `vite.config.ts`
 * and both vitest configs). Declared rather than imported so `Kwami.getVersion()` cannot
 * drift from `package.json` the way a hand-written literal did.
 */
declare const __KWAMI_VERSION__: string
