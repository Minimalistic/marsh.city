#!/usr/bin/env node

// aux-schematic.mjs — compose the canonical Aux schematic from a probe
// drawing + SVG-rendered page chrome (callouts, legend, title block).
//
// Workflow: the probe image is generated separately via aux-image.mjs as
// a clean three-quarter line drawing on vellum (_probe-only.png). This
// script wraps that image with a fully typeset schematic page — callout
// circles with leader lines, a legend table, and a title block — all
// rendered as SVG so the typography is perfect and infinitely tweakable.
//
// Usage:
//   node scripts/aux-schematic.mjs
//
// Tweak callout positions, legend, and title-block contents in the CONFIG
// block below.

import sharp from 'sharp'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

// ---- CONFIG ----------------------------------------------------------

const PROBE_PATH = resolve(root, 'public/art/the-chronoscope-program/_probe-only.png')
const OUTPUT_PATH = resolve(root, 'public/art/the-chronoscope-program/00-schematic.png')

const PAGE = { w: 1024, h: 1620 }
const VELLUM = 'rgb(232,206,159)'
const VELLUM_EDGE = 'rgb(215,188,140)'
const TABLETOP = 'rgb(44,38,30)'
const INK = 'rgb(48,34,22)'
const INK_THIN = 'rgb(80,62,42)'
const REDACT = 'rgb(35,28,22)'

const PROBE_BOX = { x: 180, y: 90, w: 664, h: 664 }
const PROBE_CENTER = { x: PROBE_BOX.x + PROBE_BOX.w / 2, y: PROBE_BOX.y + PROBE_BOX.h / 2 }

// Callout ring radius (distance of circle centers from probe center)
const CALL_R = 360
// Where each leader line "lands" on the probe (offset from probe center)
const CALLOUTS = [
  {
    n: 1, label: 'SENSOR POD', ringAngle: 25, target: { dx: 90, dy: -60 },
    note: 'Three-element stereo aperture cluster behind smoked optical glass. Yields depth perception only — every visible image we receive is generated on-board from what the cluster observes.',
  },
  {
    n: 2, label: 'ACCESS HATCH', ringAngle: 200, target: { dx: -40, dy: 40 },
    note: 'Primary field-service hatch, six-bolt closure rated to 30 G. Re-torqued before every deployment per ritual, not procedure.',
  },
  {
    n: 3, label: 'ANTENNA HOUSING', ringAngle: 90, target: { dx: 0, dy: -200 },
    note: 'Dorsal armored stub carrying the portal return-channel uplink. Asymmetric secondary housing is a redundancy retrofit from prototype testing; airframe was not requalified.',
  },
  {
    n: 4, label: 'RTG TREFOIL', ringAngle: 305, target: { dx: 150, dy: 170 },
    note: 'Statutory marking for the radioisotope sub-core. Backs the primary solar skin through night sorties and extended station-keeping.',
  },
]

const TITLE_BLOCK = {
  main: 'XR-AUSPEX-001',
  sub: 'CHRONOSCOPE PROGRAM',
  rows: ['SCALE', 'SHEET', 'DRAWN BY', 'DATE'],
}

// ---- HELPERS ---------------------------------------------------------

const polar = (cx, cy, r, angleDeg) => {
  const a = (angleDeg * Math.PI) / 180
  return { x: cx + r * Math.cos(a), y: cy - r * Math.sin(a) }
}

// deterministic PRNG so the redaction look is stable across runs
const mulberry32 = (seed) => () => {
  let t = (seed += 0x6d2b79f5)
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

// hand-drawn marker redaction: a single uniform-thickness band that
// gently wobbles along its length (a smooth sine displacement, not
// jittered noise) and overshoots slightly at the ends. Top and bottom
// edges shift together so the band never thickens or thins.
const handRedaction = (x, y, w, h, seed) => {
  const r = mulberry32(seed)
  const overshootL = 5 + r() * 5
  const overshootR = 5 + r() * 5
  const phase = r() * Math.PI * 2
  const freq = 1.2 + r() * 1.0   // low frequency = long smooth waves
  const amp = 0.9 + r() * 0.6    // small amplitude in px
  const steps = Math.max(20, Math.floor(w / 6))
  const shiftAt = (t) => Math.sin(t * Math.PI * freq + phase) * amp
  const baseTop = y
  const baseBot = y + h
  const pts = []
  // left overshoot edge
  pts.push([x - overshootL, baseTop + shiftAt(0)])
  // top edge, walking left → right with smooth wobble
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    pts.push([x + t * w, baseTop + shiftAt(t)])
  }
  // right overshoot edge
  pts.push([x + w + overshootR, baseTop + shiftAt(1)])
  pts.push([x + w + overshootR, baseBot + shiftAt(1)])
  // bottom edge, walking right → left with the SAME shift so thickness stays uniform
  for (let i = steps; i >= 0; i--) {
    const t = i / steps
    pts.push([x + t * w, baseBot + shiftAt(t)])
  }
  pts.push([x - overshootL, baseBot + shiftAt(0)])
  return `<polygon points="${pts.map((p) => p.map((v) => v.toFixed(1)).join(',')).join(' ')}" fill="${REDACT}"/>`
}

const probeBase64 = readFileSync(PROBE_PATH).toString('base64')

// ---- SVG: callouts ---------------------------------------------------

const calloutsSvg = CALLOUTS.map((c) => {
  const ring = polar(PROBE_CENTER.x, PROBE_CENTER.y, CALL_R, c.ringAngle)
  const target = { x: PROBE_CENTER.x + c.target.dx, y: PROBE_CENTER.y + c.target.dy }
  const dx = target.x - ring.x
  const dy = target.y - ring.y
  const dist = Math.hypot(dx, dy) || 1
  // start leader line just outside the callout circle
  const lineStart = { x: ring.x + (dx / dist) * 22, y: ring.y + (dy / dist) * 22 }
  return `
    <line x1="${lineStart.x.toFixed(1)}" y1="${lineStart.y.toFixed(1)}"
          x2="${target.x.toFixed(1)}" y2="${target.y.toFixed(1)}"
          stroke="${INK}" stroke-width="1.2"/>
    <circle cx="${target.x.toFixed(1)}" cy="${target.y.toFixed(1)}" r="3" fill="${INK}"/>
    <circle cx="${ring.x.toFixed(1)}" cy="${ring.y.toFixed(1)}" r="20"
            fill="${VELLUM}" stroke="${INK}" stroke-width="1.5"/>
    <text x="${ring.x.toFixed(1)}" y="${(ring.y + 7).toFixed(1)}"
          text-anchor="middle"
          font-family="Helvetica Neue, Helvetica, Arial, sans-serif"
          font-size="20" font-weight="600" fill="${INK}">${c.n}</text>
  `
}).join('')

// ---- SVG: legend table ----------------------------------------------

const LEG = { x: 80, y: 880, w: 460, headerH: 44, rowH: 44, numCol: 64 }
const legHeight = LEG.headerH + LEG.rowH * CALLOUTS.length
const legendRowsSvg = CALLOUTS.map((c, i) => {
  const yTop = LEG.y + LEG.headerH + i * LEG.rowH
  const yMid = yTop + LEG.rowH / 2 + 7
  const divider = i < CALLOUTS.length - 1
    ? `<line x1="${LEG.x}" y1="${yTop + LEG.rowH}" x2="${LEG.x + LEG.w}" y2="${yTop + LEG.rowH}" stroke="${INK_THIN}" stroke-width="0.8"/>`
    : ''
  return `
    <text x="${LEG.x + LEG.numCol / 2}" y="${yMid}"
          text-anchor="middle"
          font-family="Helvetica Neue, Helvetica, Arial, sans-serif"
          font-size="22" font-weight="700" fill="${INK}">${c.n}</text>
    <text x="${LEG.x + LEG.numCol + 16}" y="${yMid}"
          font-family="Helvetica Neue, Helvetica, Arial, sans-serif"
          font-size="18" font-weight="500" fill="${INK}"
          letter-spacing="1.2">${c.label}</text>
    ${divider}
  `
}).join('')

const legendSvg = `
  <rect x="${LEG.x}" y="${LEG.y}" width="${LEG.w}" height="${legHeight}"
        fill="none" stroke="${INK}" stroke-width="1.5"/>
  <line x1="${LEG.x}" y1="${LEG.y + LEG.headerH}" x2="${LEG.x + LEG.w}" y2="${LEG.y + LEG.headerH}" stroke="${INK}" stroke-width="1.2"/>
  <line x1="${LEG.x + LEG.numCol}" y1="${LEG.y + LEG.headerH}" x2="${LEG.x + LEG.numCol}" y2="${LEG.y + legHeight}" stroke="${INK_THIN}" stroke-width="0.8"/>
  <text x="${LEG.x + LEG.w / 2}" y="${LEG.y + LEG.headerH * 0.65}"
        text-anchor="middle"
        font-family="Helvetica Neue, Helvetica, Arial, sans-serif"
        font-size="18" font-weight="700" fill="${INK}" letter-spacing="4">LEGEND</text>
  ${legendRowsSvg}
`

// ---- SVG: title block -----------------------------------------------

const TB = { x: 560, y: 880, w: 384, h: legHeight }
const HEADER_H = 102
const cellH = (TB.h - HEADER_H) / TITLE_BLOCK.rows.length
const labelColW = 110
const titleRowsSvg = TITLE_BLOCK.rows.map((label, i) => {
  const yTop = TB.y + HEADER_H + i * cellH
  const yMid = yTop + cellH / 2 + 5
  const bottom = i < TITLE_BLOCK.rows.length - 1
    ? `<line x1="${TB.x}" y1="${yTop + cellH}" x2="${TB.x + TB.w}" y2="${yTop + cellH}" stroke="${INK_THIN}" stroke-width="0.8"/>`
    : ''
  return `
    <line x1="${TB.x + labelColW}" y1="${yTop}" x2="${TB.x + labelColW}" y2="${yTop + cellH}" stroke="${INK_THIN}" stroke-width="0.8"/>
    <text x="${TB.x + labelColW / 2}" y="${yMid}"
          text-anchor="middle"
          font-family="Helvetica Neue, Helvetica, Arial, sans-serif"
          font-size="13" font-weight="600" fill="${INK}" letter-spacing="1.5">${label}</text>
    ${handRedaction(TB.x + labelColW + 24, yMid - 13, TB.w - labelColW - 48, 16, 991 + i * 37)}
    ${bottom}
  `
}).join('')

const titleSvg = `
  <rect x="${TB.x}" y="${TB.y}" width="${TB.w}" height="${TB.h}" fill="none" stroke="${INK}" stroke-width="1.5"/>
  <line x1="${TB.x}" y1="${TB.y + HEADER_H}" x2="${TB.x + TB.w}" y2="${TB.y + HEADER_H}" stroke="${INK}" stroke-width="1.2"/>
  <text x="${TB.x + TB.w / 2}" y="${TB.y + 50}"
        text-anchor="middle"
        font-family="Helvetica Neue, Helvetica, Arial, sans-serif"
        font-size="34" font-weight="700" fill="${INK}" letter-spacing="2">${TITLE_BLOCK.main}</text>
  <text x="${TB.x + TB.w / 2}" y="${TB.y + 82}"
        text-anchor="middle"
        font-family="Helvetica Neue, Helvetica, Arial, sans-serif"
        font-size="14" font-weight="500" fill="${INK}" letter-spacing="3">${TITLE_BLOCK.sub}</text>
  ${titleRowsSvg}
`

// ---- SVG: field-notes panel -----------------------------------------

const NOTES = { x: 80, y: 1130, w: 864, headerH: 44, rowH: 92 }
const notesHeight = NOTES.headerH + NOTES.rowH * CALLOUTS.length

// crude word-wrap → returns an array of lines
const wrap = (text, maxChars) => {
  const words = text.split(/\s+/)
  const lines = []
  let line = ''
  for (const w of words) {
    if ((line + ' ' + w).trim().length > maxChars) {
      lines.push(line.trim())
      line = w
    } else {
      line += ' ' + w
    }
  }
  if (line.trim()) lines.push(line.trim())
  return lines
}

const notesRowsSvg = CALLOUTS.map((c, i) => {
  const yTop = NOTES.y + NOTES.headerH + i * NOTES.rowH
  const numX = NOTES.x + 32
  const labelX = NOTES.x + 90
  const noteX = NOTES.x + 90
  const lines = wrap(c.note, 78)
  const divider = i < CALLOUTS.length - 1
    ? `<line x1="${NOTES.x}" y1="${yTop + NOTES.rowH}" x2="${NOTES.x + NOTES.w}" y2="${yTop + NOTES.rowH}" stroke="${INK_THIN}" stroke-width="0.8"/>`
    : ''
  const noteLinesSvg = lines.map((ln, k) => `
    <text x="${noteX}" y="${yTop + 50 + k * 18}"
          font-family="Helvetica Neue, Helvetica, Arial, sans-serif"
          font-size="14" font-weight="400" fill="${INK}" letter-spacing="0.3">${ln}</text>
  `).join('')
  return `
    <text x="${numX}" y="${yTop + 32}"
          text-anchor="middle"
          font-family="Helvetica Neue, Helvetica, Arial, sans-serif"
          font-size="20" font-weight="700" fill="${INK}">${c.n}</text>
    <text x="${labelX}" y="${yTop + 32}"
          font-family="Helvetica Neue, Helvetica, Arial, sans-serif"
          font-size="16" font-weight="700" fill="${INK}" letter-spacing="1.5">${c.label}</text>
    ${noteLinesSvg}
    ${divider}
  `
}).join('')

const notesSvg = `
  <rect x="${NOTES.x}" y="${NOTES.y}" width="${NOTES.w}" height="${notesHeight}"
        fill="none" stroke="${INK}" stroke-width="1.5"/>
  <line x1="${NOTES.x}" y1="${NOTES.y + NOTES.headerH}" x2="${NOTES.x + NOTES.w}" y2="${NOTES.y + NOTES.headerH}" stroke="${INK}" stroke-width="1.2"/>
  <line x1="${NOTES.x + 64}" y1="${NOTES.y + NOTES.headerH}" x2="${NOTES.x + 64}" y2="${NOTES.y + notesHeight}" stroke="${INK_THIN}" stroke-width="0.8"/>
  <text x="${NOTES.x + NOTES.w / 2}" y="${NOTES.y + NOTES.headerH * 0.65}"
        text-anchor="middle"
        font-family="Helvetica Neue, Helvetica, Arial, sans-serif"
        font-size="18" font-weight="700" fill="${INK}" letter-spacing="4">FIELD NOTES</text>
  ${notesRowsSvg}
`

// ---- SVG: scan / paper effects --------------------------------------

// subtle paper-edge vignette and a faint fold crease across the middle
const effectsSvg = `
  <defs>
    <linearGradient id="foldGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="rgba(0,0,0,0)"/>
      <stop offset="49%"  stop-color="rgba(0,0,0,0)"/>
      <stop offset="50%"  stop-color="rgba(60,40,20,0.18)"/>
      <stop offset="51%"  stop-color="rgba(0,0,0,0)"/>
      <stop offset="100%" stop-color="rgba(0,0,0,0)"/>
    </linearGradient>
    <radialGradient id="edgeVignette" cx="50%" cy="50%" r="70%">
      <stop offset="60%" stop-color="rgba(0,0,0,0)"/>
      <stop offset="100%" stop-color="rgba(40,28,15,0.22)"/>
    </radialGradient>
  </defs>
  <rect x="0" y="0" width="${PAGE.w}" height="${PAGE.h}" fill="url(#foldGrad)" pointer-events="none"/>
  <rect x="0" y="0" width="${PAGE.w}" height="${PAGE.h}" fill="url(#edgeVignette)" pointer-events="none"/>
`

// ---- COMPOSE ---------------------------------------------------------

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${PAGE.w}" height="${PAGE.h}" viewBox="0 0 ${PAGE.w} ${PAGE.h}">
  <rect width="${PAGE.w}" height="${PAGE.h}" fill="${VELLUM}"/>
  <image href="data:image/png;base64,${probeBase64}"
         x="${PROBE_BOX.x}" y="${PROBE_BOX.y}"
         width="${PROBE_BOX.w}" height="${PROBE_BOX.h}"/>
  ${calloutsSvg}
  ${legendSvg}
  ${titleSvg}
  ${notesSvg}
  ${effectsSvg}
</svg>
`

// render the page, then extend with tabletop background so the sheet
// reads as a photograph of a document on a surface
const pageBuf = await sharp(Buffer.from(svg)).png().toBuffer()
await sharp(pageBuf)
  .extend({ top: 56, bottom: 56, left: 56, right: 56, background: TABLETOP })
  .png()
  .toFile(OUTPUT_PATH)

console.log(`composed → ${OUTPUT_PATH.replace(root + '/', '')}`)
