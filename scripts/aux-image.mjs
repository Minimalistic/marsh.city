#!/usr/bin/env node

// aux-image.mjs — generate Chronoscope/Aux images via gpt-image-1.
//
// Usage:
//   node scripts/aux-image.mjs --series the-chronoscope-program --out hero-plate.png --prompt "..."
//   echo "prompt body" | node scripts/aux-image.mjs --series dinosaurs --out 001-floodplain.png
//   node scripts/aux-image.mjs --series dinosaurs --out 001.png --prompt-file ./prompt.txt
//
// Flags:
//   --series        target series slug (folder under public/art/)
//   --out           output filename (saved to public/art/<series>/<out>)
//   --prompt        prompt string (or omit and pipe via stdin, or use --prompt-file)
//   --prompt-file   read prompt from a file
//   --preset        prepend shared visual canon. Available: lab
//   --reference     path to an existing image to use as visual reference
//                   (switches to the images.edit endpoint — locks Aux's
//                   design and the lab's look across generations)
//   --size          1024x1024 (default), 1536x1024, 1024x1536, or auto
//   --quality       low | medium | high (default: medium)
//
// Reads OPENAI_API_KEY from env or .env in the project root.

import OpenAI from 'openai'
import { readFileSync, existsSync, writeFileSync, mkdirSync, readSync, createReadStream } from 'fs'
import { resolve, dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { toFile } from 'openai'
import { PRESETS } from './aux-prompts.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

function loadKey() {
  if (process.env.OPENAI_API_KEY) return process.env.OPENAI_API_KEY
  const envPath = resolve(root, '.env')
  if (existsSync(envPath)) {
    const match = readFileSync(envPath, 'utf8').match(/^OPENAI_API_KEY=(.+)$/m)
    if (match) return match[1].trim()
  }
  process.stderr.write('Error: OPENAI_API_KEY not found in env or .env\n')
  process.exit(1)
}

const args = process.argv.slice(2)
function flag(name) {
  const i = args.indexOf(name)
  return i === -1 ? null : (args[i + 1] || null)
}

const series = flag('--series')
const out = flag('--out')
const promptFlag = flag('--prompt')
const promptFile = flag('--prompt-file')
const preset = flag('--preset')
const reference = flag('--reference')
const size = flag('--size') || '1024x1024'
const quality = flag('--quality') || 'medium'

if (!series || !out) {
  process.stderr.write('Error: --series and --out are required\n')
  process.exit(1)
}

function readStdin() {
  // synchronous read of all stdin
  const chunks = []
  const buf = Buffer.alloc(65536)
  try {
    while (true) {
      const n = readSync(0, buf, 0, buf.length, null)
      if (n === 0) break
      chunks.push(Buffer.from(buf.subarray(0, n)))
    }
  } catch {}
  return Buffer.concat(chunks).toString('utf8').trim()
}

let prompt = promptFlag
if (!prompt && promptFile) prompt = readFileSync(resolve(promptFile), 'utf8').trim()
if (!prompt && !process.stdin.isTTY) prompt = readStdin()
if (!prompt) {
  process.stderr.write('Error: no prompt provided (use --prompt, --prompt-file, or pipe via stdin)\n')
  process.exit(1)
}

if (preset) {
  const blocks = PRESETS[preset]
  if (!blocks) {
    process.stderr.write(`Error: unknown preset "${preset}". Available: ${Object.keys(PRESETS).join(', ')}\n`)
    process.exit(1)
  }
  prompt = [...blocks, 'SPECIFIC SCENE:', prompt].join('\n\n')
}

const outDir = resolve(root, 'public', 'art', series)
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true })
const outPath = join(outDir, out)

const client = new OpenAI({ apiKey: loadKey() })

const mode = reference ? 'editing from reference' : 'generating'
process.stderr.write(`${mode} ${size} ${quality} → ${outPath.replace(root + '/', '')}\n`)

let result
if (reference) {
  const refPath = resolve(reference)
  if (!existsSync(refPath)) {
    process.stderr.write(`Error: reference image not found at ${refPath}\n`)
    process.exit(1)
  }
  const refFile = await toFile(createReadStream(refPath), 'reference.png', { type: 'image/png' })
  result = await client.images.edit({
    model: 'gpt-image-1',
    image: refFile,
    prompt,
    size,
    quality,
    n: 1,
  })
} else {
  result = await client.images.generate({
    model: 'gpt-image-1',
    prompt,
    size,
    quality,
    n: 1,
  })
}

const b64 = result.data?.[0]?.b64_json
if (!b64) {
  process.stderr.write('Error: no image data returned\n')
  process.stderr.write(JSON.stringify(result, null, 2) + '\n')
  process.exit(1)
}

writeFileSync(outPath, Buffer.from(b64, 'base64'))
process.stderr.write(`saved ${outPath.replace(root + '/', '')}\n`)
if (result.usage) {
  process.stderr.write(`tokens: input=${result.usage.input_tokens ?? '?'} output=${result.usage.output_tokens ?? '?'}\n`)
}
