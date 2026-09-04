import { defineConfig, type Plugin } from 'vite';
import { resolve, dirname, extname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

const __dirname = fileURLToPath(new URL('.', import.meta.url))

/**
 * Plugin to inline ?raw imports in library mode.
 * Vite's built-in ?raw handling doesn't work with preserveModules.
 */
function inlineRawPlugin(): Plugin {
  return {
    name: 'inline-raw',
    enforce: 'pre',
    resolveId(source, importer) {
      if (source.endsWith('?raw') && importer) {
        const cleanPath = source.slice(0, -4) // remove ?raw
        const absolutePath = resolve(dirname(importer), cleanPath)
        return `\0raw:${absolutePath}`
      }
      return null
    },
    load(id) {
      if (id.startsWith('\0raw:')) {
        const filePath = id.slice(5)
        const content = readFileSync(filePath, 'utf-8')
        return `export default ${JSON.stringify(content)};`
      }
      return null
    },
  }
}

/**
 * Plugin to inline image assets as base64 data URLs in library mode.
 * Required because preserveModules doesn't work well with external assets.
 */
function inlineImagePlugin(): Plugin {
  const imageExtensions = ['.jpeg', '.jpg', '.png', '.gif', '.webp']
  const mimeTypes: Record<string, string> = {
    '.jpeg': 'image/jpeg',
    '.jpg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
  }

  return {
    name: 'inline-image',
    enforce: 'pre',
    resolveId(source, importer) {
      const ext = extname(source).toLowerCase()
      if (imageExtensions.includes(ext) && importer) {
        const absolutePath = resolve(dirname(importer), source)
        return `\0image:${absolutePath}`
      }
      return null
    },
    load(id) {
      if (id.startsWith('\0image:')) {
        const filePath = id.slice(7)
        const ext = extname(filePath).toLowerCase()
        const mimeType = mimeTypes[ext] || 'application/octet-stream'
        const content = readFileSync(filePath)
        const base64 = content.toString('base64')
        const dataUrl = `data:${mimeType};base64,${base64}`
        return `export default ${JSON.stringify(dataUrl)};`
      }
      return null
    },
  }
}

const pkg = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf-8')) as {
  version: string
}

export default defineConfig({
  define: {
    __KWAMI_VERSION__: JSON.stringify(pkg.version),
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: 'index',
    },
    outDir: 'dist',
    rollupOptions: {
      // Peer deps and their subpaths must stay bare imports. Listing only the package root
      // lets Rollup rewrite `three/examples/...` to a pnpm store path under dist/node_modules/,
      // which breaks consumers and CI artifact reuse (upload-artifact drops hidden `.pnpm` dirs).
      external: (id) =>
        id === 'three' ||
        id.startsWith('three/') ||
        id === 'livekit-client' ||
        id.startsWith('livekit-client/') ||
        id === 'simplex-noise' ||
        id.startsWith('simplex-noise/'),
      output: {
        preserveModules: true,
        preserveModulesRoot: 'src',
        entryFileNames: '[name].js',
      },
    },
    sourcemap: true,
    minify: false,
  },
  plugins: [inlineRawPlugin(), inlineImagePlugin()],
})
