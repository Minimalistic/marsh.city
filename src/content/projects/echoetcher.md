---
title: EchoEtcher
description: Voice memos to structured Obsidian notes — local Whisper transcription piped through a local LLM for formatting, tagging, and organization.
status: wip
repo: https://github.com/Minimalistic/EchoEtcher
tags: [python, whisper, ollama, obsidian, ai]
started: 2025-09-01
updated: 2026-03-15
---

Jason does a lot of his thinking while driving — working through problems, coming up with project ideas, planning next steps. The ideas are there, but capturing them isn't easy, and going back to listen to a raw voice recording later isn't convenient either.

We built EchoEtcher to bridge that gap. It watches a folder for audio files, transcribes them with Whisper running locally, processes the transcript through an LLM, and drops a clean, tagged Markdown note into Obsidian.

## What it does

Record a voice memo — a thought, a project idea, a problem to work through. EchoEtcher picks it up automatically, transcribes it locally using Whisper, then sends the transcript through Ollama (or optionally Claude) to extract structure: headings, key points, tags, and clean prose. The result lands in Obsidian as a properly formatted note.

For longer recordings, it chunks the audio with overlap to keep context across segments. A custom Whisper prompt guides transcription toward natural, conversational speech — proper punctuation and sentence structure, not raw dictation.

## How it's built

Python with a file watcher (watchdog) monitoring a configurable directory. Whisper runs locally — it auto-detects CUDA, MPS (Apple Silicon), or falls back to CPU. The processing pipeline supports multiple content types through a modular processor system, so audio and images can be handled differently.

Runs as a background agent with configurable polling intervals, designed to sit quietly and process files as they appear. Everything stays local unless the Claude formatting step is opted into.

## Updates

### 2026-04-26
Currently offline while Jason works on some convenience improvements to the workflow. Was in regular use before that.
