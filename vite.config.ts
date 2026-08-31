import { createHash } from 'node:crypto'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, posix, relative, sep } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin, type ResolvedConfig } from 'vite'

// Everything the app shell is made of. `.woff` is the legacy sibling fontsource emits
// next to every `.woff2`; no browser that has a service worker will ever ask for one,
// so precaching them would double the install for nothing.
const SHELL_ASSET = /\.(?:js|css|woff2|svg|png|webmanifest)$/

function listFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? listFiles(path) : [path]
  })
}

/** Emits `sw.js` from `src/sw.js`, with the built shell's URLs and a version stamped
 *  into it. The version hashes the precached files' *contents*, not just their names,
 *  so an unhashed public file — an icon, the manifest — still invalidates the cache
 *  when it changes, and a rebuild that changes nothing emits an identical worker the
 *  browser has no reason to reinstall. */
function contourServiceWorker(): Plugin {
  let config: ResolvedConfig

  return {
    name: 'contour-service-worker',
    apply: 'build',
    // After Vite's own HTML plugin, so `index.html` is in the bundle to be hashed:
    // the shell has to invalidate when its markup changes and not only when the
    // hashed script it points at does.
    enforce: 'post',
    configResolved(resolved) {
      config = resolved
    },
    generateBundle(_options, bundle) {
      const hash = createHash('sha256')
      const urls: string[] = []

      const add = (fileName: string, contents: string | Uint8Array) => {
        urls.push(posix.join(config.base, fileName))
        hash.update(fileName)
        hash.update(contents)
      }

      for (const [fileName, output] of Object.entries(bundle)) {
        if (fileName === 'sw.js' || !SHELL_ASSET.test(fileName) || fileName.endsWith('.html')) continue
        add(fileName, output.type === 'chunk' ? output.code : (output.source as string | Uint8Array))
      }

      // Files copied verbatim out of `public/`: the manifest and the icons. They carry
      // no content hash in their names, which is why their bytes go into the version.
      if (config.publicDir) {
        for (const path of listFiles(config.publicDir)) {
          const fileName = relative(config.publicDir, path).split(sep).join('/')
          if (!SHELL_ASSET.test(fileName)) continue
          add(fileName, readFileSync(path))
        }
      }

      const shell = posix.join(config.base, 'index.html')
      const html = bundle['index.html']
      if (html && html.type === 'asset') {
        urls.push(shell)
        hash.update(html.source as string)
      }

      this.emitFile({
        type: 'asset',
        fileName: 'sw.js',
        source: readFileSync(join(config.root, 'src/sw.js'), 'utf8')
          .replace('__VERSION__', hash.digest('hex').slice(0, 12))
          .replace('__PRECACHE__', JSON.stringify(urls.sort()))
          .replace('__SHELL__', shell),
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), contourServiceWorker()],
})
