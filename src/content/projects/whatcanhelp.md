---
title: WhatCanHelp
description: A free assistive technology discovery tool that matches people with the right AT products through guided intake, a browsable catalog, and exportable PDF reports.
status: wip
repo: https://github.com/Minimalistic/WhatCanHelp
tags: [node, sqlite, express, vanilla-js, claude-api, accessibility, at]
started: 2026-03-01
updated: 2026-04-26
---

WhatCanHelp is a free tool for finding assistive technology products that actually fit someone's situation. Not a search engine, not a product catalog - a guided process that starts with needs and ends with a professional-grade report you can hand to a funding source or bring to a meeting.

I built it because the AT discovery process is broken. Professionals rely on word-of-mouth and conference demos. Families search Google and drown in options they can't evaluate. Funding applications need specific product recommendations with justifications. WhatCanHelp connects those dots.

## The landing page

![WhatCanHelp landing page showing the warm paper-like aesthetic and three-step workflow](/images/whatcanhelp/landing.png)

The first thing you see is "Find what actually helps" - no feature list, no sign-up wall. The visual design is intentionally warm and editorial: cream backgrounds, serif headings in DM Serif Display, generous whitespace. It reads more like a reference book than a web app.

That was a deliberate choice. The audience includes older adults, family caregivers, and professionals who've been burned by flashy health-tech products that over-promise. The design needs to say "trustworthy reference" before a single word is read. A three-step visual explainer shows the whole workflow up front: answer questions, get personalized results, download a PDF report.

## Guided intake

![The guided intake wizard showing step one with progress dots and option pills](/images/whatcanhelp/intake.png)

The intake is a four-step conversational wizard, not a form dump. Step one asks who this is for - myself, my child, a parent, a student, a client. Step two presents challenge areas as a grid of checkbox cards: motor, speech, vision, hearing, cognition, learning, daily tasks, computer access.

The card-based layout matters here. Checkboxes in a vertical list feel clinical. Cards with clear labels and generous tap targets feel like choosing, not filling out paperwork. Step three refines with optional dropdowns for age group, budget, and platform - all skippable, because sometimes you don't know yet. Step four is a free-text area for context that doesn't fit neat categories.

Progress dots with connecting lines run across the top. You can see where you are, how much is left, and that the process is finite. That visibility reduces the "how long is this going to take" anxiety that kills completion rates on intake forms.

## Browse catalog

![The browsable product catalog with sidebar filters, complexity badges, and a highlights carousel](/images/whatcanhelp/catalog.png)

The catalog supports two views - a card grid and a dense table - with a sidebar of faceted filters. Products show a thumbnail, name, manufacturer, price range, and a color-coded complexity badge.

The complexity badges are one of the more important design decisions in the whole app. Every product gets rated on a four-tier scale: self-serve (green), guided setup (yellow), professional recommended (orange), and professional required (red). These badges appear everywhere - catalog, detail pages, PDF reports - creating a consistent visual language for "how much help will someone need with this?"

That matters because one of the biggest failure modes in AT is recommending a product someone can't actually set up or maintain. A $200 AAC app is worthless if nobody in the household can configure it. The complexity rating makes that risk visible at a glance, before anyone commits time or funding.

## Product detail

![A product detail page showing the AI-generated description, complexity rating, and setup guidance](/images/whatcanhelp/detail.png)

Each product page shows an AI-generated plain-language description, specifications, supported platforms, pricing with vendor links, and related products. The descriptions are written by Claude and stored after review - not generated on the fly - so they're consistent and editable.

The detail page also surfaces funding eligibility: which products qualify for Medicaid, vocational rehabilitation, school district budgets, or other common funding paths. For professionals writing justification letters, having this in one place saves hours of research per recommendation.

## PDF reports

The PDF export is the whole point of the workflow. After intake, WhatCanHelp generates a report that includes the person's profile, matched products with explanations of why each one fits, complexity warnings, and guidance notes. The PDF uses the same color system as the web interface - terracotta accents, complexity-tier badges - so it feels like a cohesive document, not a browser print dump.

This exists because the gap between "found a good product" and "got it funded" is where most AT recommendations die. The report is formatted for the people who approve purchases: case managers, IEP teams, vocational rehab counselors. It gives them what they need to say yes.

## Accessibility controls

![The header accessibility dropdown with theme toggle and text size controls](/images/whatcanhelp/accessibility.png)

A dropdown in the header offers a theme toggle (auto/light/dark) and three font size levels. These aren't decorative - they're load-bearing for the audience. The font sizing uses relative units throughout, so bumping to the largest size scales everything proportionally without breaking layouts.

The color system targets WCAG AA contrast ratios across all three themes and all four complexity-tier colors. Dark mode isn't an afterthought; it was designed alongside light mode, with the warm palette adapted rather than just inverted.

## How it's built

Node.js and Express on the backend, SQLite for all data, vanilla JavaScript on the frontend. The Anthropic API powers product descriptions, intake matching, and classification. A pluggable scraper framework pulls product data from manufacturer sites - AbleNet, Freedom Scientific, HumanWare, and others - with content hashing for change detection.

The taxonomy system is tag-based across seven dimensions: need, solution type, platform, complexity, price band, funding eligibility, and age range. This avoids the rigid category trees that make most AT databases frustrating to search - a product can be tagged across multiple needs without being duplicated.

## Who it's for

AT professionals who need to make faster, better-informed recommendations. Family members trying to figure out what exists. Anyone involved in the funding process who needs documentation. The goal is to make the entire discovery-to-justification pipeline something one person can do in a sitting, instead of the weeks it currently takes.
