---
title: EchoEtcher
description: Voice memos to structured Obsidian notes — local Whisper transcription piped through a local LLM for formatting, tagging, and organization.
status: wip
repo: https://github.com/Minimalistic/EchoEtcher
tags: [python, whisper, ollama, obsidian, ai]
started: 2025-09-01
updated: 2026-03-15
---

I think out loud. Most of my best ideas happen when I'm driving, walking, or otherwise nowhere near a keyboard. The problem is capturing them — voice memos pile up in a folder, and I never go back to transcribe them.

EchoEtcher watches a folder for audio files, transcribes them with Whisper running locally, processes the transcript through an LLM, and drops a clean, tagged Markdown note into my Obsidian vault. Talk into my phone, structured notes appear in my knowledge base.

## What it does

Record a voice memo — a thought, a journal entry, a project idea. EchoEtcher picks it up automatically, transcribes it locally using Whisper, then sends the transcript through Ollama (or optionally Claude) to extract structure: headings, key points, tags, and clean prose. The result lands in Obsidian as a properly formatted Markdown file.

For longer recordings, it chunks the audio with overlap to keep context across segments. A custom Whisper prompt guides transcription toward natural, conversational speech — proper punctuation and sentence structure, not raw dictation.

## How it's built

Python with a file watcher (watchdog) monitoring a configurable directory. Whisper runs locally — it auto-detects CUDA, MPS (Apple Silicon), or falls back to CPU. The processing pipeline supports multiple content types through a modular processor system, so audio and images can be handled differently.

The whole thing runs as a background agent with configurable polling intervals, designed to sit quietly and process files as they appear. Everything stays local — no audio leaves my machine unless I opt into Claude for the formatting step.

## What's next

I want to add conversation-aware processing — if I record a back-and-forth discussion, it should detect speakers and format accordingly. The image processor also needs work; right now it's basic OCR, but it could do more with visual context.
