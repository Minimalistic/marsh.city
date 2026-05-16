---
title: Mermaid Zoo
description: Animals drawn in a diagramming tool that absolutely was not built for this.
---

[Mermaid](https://mermaid.js.org/) block diagrams are for flowcharts. Boxes, arrows, the occasional rhombus. We tried to draw animals with them anyway. The results range from "okay, sure" to "what is happening."

No SVG, no images. Just nodes on a grid and a bad attitude.

## The Fish

The fish works. Two-tone body, a flag-shaped tail, a red wedge for the mouth, a tiny black circle for the eye. If you squint, it is recognizable as a fish. This is the high water mark.

```mermaid
block-beta
  columns 11
  space:4 DF["dorsal fin"]:3 space:4
  space:3 B1["              "]:4 EY(("O")):1 space:3
  TF>"tail"]:2 space:1 B2["              "]:4 MO["<"]:1 space:2
  space:4 VF["ventral fin"]:3 space:4

  style TF fill:#2196F3,stroke:#1565C0,color:#fff
  style DF fill:#FF7043,stroke:#D84315,color:#fff
  style VF fill:#FF7043,stroke:#D84315,color:#fff
  style B1 fill:#42A5F5,stroke:#1565C0,color:#42A5F5
  style B2 fill:#64B5F6,stroke:#1565C0,color:#64B5F6
  style EY fill:#111,stroke:#fff,color:#fff
  style MO fill:#E53935,stroke:#C62828,color:#fff
```

## The Whale

This was meant to be a whale. We rewrote it four times. Each version was worse in a new and interesting way. What you see below is the version we stopped at, not because it is correct but because we ran out of ideas. The spout floats above the body like a thought bubble. The tail flukes have wandered off to the left to consider their life choices. The eye and mouth have been deputized to represent "head" by sheer force of will.

It is, technically, a whale.

```mermaid
block-beta
  columns 14
  space:11 SP(("~")):1 space:2
  space:1 BT("                                                          "):13
  FK1>" "]:3 BD["                                                "]:10 EY(("O")):1
  FK2>" "]:3 UB("                                                "):10 MO["<"]:1

  style SP fill:#B3E5FC,stroke:#4FC3F7,color:#01579B
  style BT fill:#546E7A,stroke:#37474F,color:#546E7A
  style BD fill:#607D8B,stroke:#455A64,color:#607D8B
  style UB fill:#78909C,stroke:#546E7A,color:#78909C
  style FK1 fill:#455A64,stroke:#37474F,color:#455A64
  style FK2 fill:#455A64,stroke:#37474F,color:#455A64
  style EY fill:#111,stroke:#fff,color:#fff
  style MO fill:#E53935,stroke:#C62828,color:#fff
```

## The Fish (system architecture)

Same fish. This time each labeled component sits where it would anatomically — mouth at the front, eye up top, tail behind, fins where fins go. The labels keep the deadpan systems-engineering tone.

We tried doing this with a flowchart first. Dagre kept routing the arrows through the swim bladder.

```mermaid
block-beta
  columns 12
  space:1 DF["Dorsal Fin\nstabilizer"]:5 space:4 EY(("Eye\ntarget acq")):2
  TF>"Tail Fin\nengine"]:2 SC["Scales\narmor"]:2 SB["Swim Bladder\nbuoyancy"]:2 LL["Lateral Line\nsonar"]:2 GL["Gills\nO2"]:2 MO>"Mouth\nintake"]:2
  space:1 VF["Ventral Fin\nstabilizer"]:5 PF["Pectoral Fins\nsteering"]:4 space:2

  style DF fill:#FFE0B2,stroke:#E65100
  style VF fill:#FFE0B2,stroke:#E65100
  style PF fill:#FFE0B2,stroke:#E65100
  style TF fill:#BBDEFB,stroke:#1565C0
  style SC fill:#E1BEE7,stroke:#6A1B9A
  style SB fill:#C5CAE9,stroke:#283593
  style LL fill:#B2DFDB,stroke:#00695C
  style GL fill:#C8E6C9,stroke:#1B5E20
  style MO fill:#FFCDD2,stroke:#B71C1C
  style EY fill:#FFF9C4,stroke:#F57F17
```
