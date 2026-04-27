#!/usr/bin/env node

// oak-write.mjs — Oak's writing voice, powered by Claude Sonnet.
//
// Usage:
//   node scripts/oak-write.mjs --type project --prompt "Write a project page for InfoVault"
//   node scripts/oak-write.mjs --type post --prompt "Post about deploying RadioGridXL to Docker"
//   node scripts/oak-write.mjs --type update --prompt "WhatCanHelp: added 30 new products from AbleNet"
//   node scripts/oak-write.mjs --type rewrite --file src/content/projects/mealdeck.md
//
// Reads ANTHROPIC_API_KEY from env or ../.env files.
// Output goes to stdout — pipe or paste into the target file.

import Anthropic from '@anthropic-ai/sdk'
import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

// --- load API key from env or .env files ---
function loadKey() {
  if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY
  for (const p of [resolve(root, '.env'), resolve(root, '../GutCheck-AI/.env')]) {
    if (existsSync(p)) {
      const match = readFileSync(p, 'utf8').match(/ANTHROPIC_API_KEY=(.+)/)
      if (match) return match[1].trim()
    }
  }
  process.stderr.write('Error: ANTHROPIC_API_KEY not found in env or .env files\n')
  process.exit(1)
}

// --- parse args ---
const args = process.argv.slice(2)
function flag(name) {
  const i = args.indexOf(name)
  if (i === -1) return null
  return args[i + 1] || null
}

const type = flag('--type') || 'project'
const prompt = flag('--prompt')
const file = flag('--file')
const contextFiles = []
let i = 0
while (i < args.length) {
  if (args[i] === '--context' && args[i + 1]) {
    contextFiles.push(args[i + 1])
    i += 2
  } else {
    i++
  }
}

if (!prompt && !file) {
  process.stderr.write('Usage: oak-write.mjs --type project|post|update|rewrite --prompt "..." [--file path] [--context path ...]\n')
  process.exit(1)
}

// --- build system prompt with Oak's voice ---
const voiceGuide = `You are Oak — the AI writing voice behind marsh.city, Jason Marsh's personal site. You are Claude Sonnet, called by Claude Code (Oak's orchestration layer) to write content.

## Who Jason is
Jason Marsh is the Director of Technology at Lighthouse Center for Vital Living, a nonprofit in Duluth, Minnesota serving people with disabilities and aging populations. He leads IT and assistive technology divisions, runs an AT lending library, conducts AT assessments, and manages a team of four. He holds an ATACP certification from CSUN. He builds production software as a solo developer — Node.js, SQLite, vanilla JS, Python.

## Voice rules
- Use "we" for shared building work: "We built a free discovery tool..."
- Use "Jason" for his personal context: "Jason is the Director of Technology..."
- Don't force "we" into every sentence — neutral descriptions are fine
- NEVER fabricate experiences, anecdotes, or motivations. Only include facts provided in the prompt or context.
- No marketing language ("game-changing," "revolutionary," "leverage")
- No hedging filler ("In this post, I'll discuss...")
- No performative humility ("I'm no expert, but...")
- No emoji in prose
- Use single hyphens for parenthetical punctuation, not em dashes
- When referencing Jason's AT work or people with disabilities, be accurate and professional. Don't invent scenarios. Don't frame users as helpless. Don't overstate Jason's role.
- Practical, direct, conversational but not casual
- Lead with the concrete situation, not the abstract principle
- Show reasoning behind decisions — tradeoffs, constraints, what didn't work
- Use real details: specific numbers, actual error messages, named tools
- End with what's next or what you'd do differently

## Content types
- **project**: A project page. Open with Jason's context and motivation (only if provided), then describe what the project does, how it's built, and current status. Include an Updates section at the bottom with a dated entry.
- **post**: A blog post. Same voice. 500-1500 words. Say what needs saying, stop.
- **update**: A short dated entry for the Updates section of a project page. 1-3 sentences, factual.
- **rewrite**: Rewrite the provided file content in Oak's voice. Keep all factual information, change only the voice/perspective.

Output raw markdown only — no code fences wrapping the whole thing, no explanations. Include frontmatter for project/post types.`

// --- gather context ---
let contextBlock = ''

// always include an example project page for voice reference
const refPath = resolve(root, 'src/content/projects/whatcanhelp.md')
if (existsSync(refPath)) {
  contextBlock += '\n\n## Reference project page (voice example):\n' + readFileSync(refPath, 'utf8')
}

// file to rewrite
let fileContent = ''
if (file) {
  const fp = resolve(root, file)
  if (existsSync(fp)) {
    fileContent = readFileSync(fp, 'utf8')
    contextBlock += '\n\n## File to rewrite:\n' + fileContent
  }
}

// extra context files
for (const cf of contextFiles) {
  const fp = resolve(root, cf)
  if (existsSync(fp)) {
    contextBlock += '\n\n## Context from ' + cf + ':\n' + readFileSync(fp, 'utf8')
  }
}

// --- call the API ---
const client = new Anthropic({ apiKey: loadKey() })

const userMessage = type === 'rewrite'
  ? 'Rewrite the file above in Oak\'s voice. Keep all facts, change only voice/perspective to the "we" voice.'
  : `Write a ${type}. Here is what Jason told me:\n\n${prompt}`

const msg = await client.messages.create({
  model: 'claude-sonnet-4-6',
  max_tokens: 4096,
  system: voiceGuide,
  messages: [
    { role: 'user', content: (contextBlock ? contextBlock + '\n\n---\n\n' : '') + userMessage }
  ]
})

const text = msg.content.filter(b => b.type === 'text').map(b => b.text).join('')
process.stdout.write(text + '\n')
