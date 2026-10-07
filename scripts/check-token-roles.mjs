// Surfaces carry backgrounds, ink carries text, and neither crosses over: the
// Highlight (navy) state remaps them in opposite directions, so a swapped token
// renders invisible rather than merely wrong-coloured. Run before promoting.
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const CHECKS = [
  [/background(-color)?\s*:\s*var\(--ncx-(ink|body|on-navy)\)/, 'ink token in a background property'],
  [/(^|[^-\w])color\s*:\s*var\(--ncx-(white|paper|cloud|raised)\)/, 'surface token in a color property'],
]

const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(dir, e.name)) : /\.(tsx?|css)$/.test(e.name) ? [join(dir, e.name)] : [])

let found = 0
for (const file of walk('src')) {
  readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
    for (const [re, what] of CHECKS) {
      if (re.test(line)) {
        console.error(`${file}:${i + 1}  ${what}\n    ${line.trim().slice(0, 110)}`)
        found++
      }
    }
  })
}
console.log(found
  ? `\n${found} role violation(s). Surfaces are --ncx-white/paper/cloud/raised; ink is --ncx-ink/body/on-navy.`
  : 'Token roles clean.')
process.exit(found ? 1 : 0)
