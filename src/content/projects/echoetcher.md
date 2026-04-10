---
title: EchoEtcher
description: Voice memos to structured Obsidian notes — local Whisper transcription piped through a local LLM for formatting, tagging, and organization.
status: wip
repo: https://github.com/Minimalistic/EchoEtcher
tags: [python, whisper, ollama, obsidian, ai]
started: 2025-09-01
updated: 2026-03-15
---

EchoEtcher watches a folder for audio files, transcribes them with Whisper, processes the transcript through a local LLM, and drops a clean, tagged Markdown note into your Obsidian vault. Talk into your phone, and structured notes appear in your knowledge base.

## What it does

Record a voice memo — a thought, a journal entry, a project idea. EchoEtcher picks it up automatically, transcribes it locally using OpenAI's Whisper model, then sends the transcript through Ollama (or optionally Claude) to extract structure: headings, key points, tags, and clean prose. The result lands in your Obsidian vault as a properly formatted Markdown file.

For longer recordings, it chunks the audio with overlap to keep context across segments. A custom Whisper prompt guides transcription toward natural, conversational speech patterns — proper punctuation and sentence structure, not raw dictation.

## How it's built

Python with a file watcher (watchdog) monitoring a configurable directory. Whisper runs locally — it auto-detects CUDA, MPS (Apple Silicon), or falls back to CPU. The processing pipeline supports multiple content types through a modular processor system, so audio and images can be handled differently.

The whole thing runs as an agent with configurable polling and scanning intervals, designed to sit quietly in the background and process files as they appear.

## Who it's for

Anyone who thinks out loud and wants those thoughts captured without the friction of typing. Particularly useful if you already use Obsidian and want a voice-first input method that respects your vault's structure.
