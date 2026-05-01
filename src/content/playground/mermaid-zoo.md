---
title: Mermaid Zoo
description: Animals built from flowchart nodes. Charming? Unhinged? You decide.
---

What happens when you try to draw animals using a diagramming tool designed for software architecture? These are built entirely from [Mermaid](https://mermaid.js.org/) block diagrams - the same tool meant for flowcharts and sequence diagrams. No SVG, no images, just nodes on a grid.

## The Fish

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

```mermaid
block-beta
  columns 13
  space:2 SP["spout"]:1 space:10
  space:1 HD["          "]:3 BD["                              "]:6 TU["tail"]:2 space:1
  space:1 EY(("O")):1 MW["          "]:2 BL["                              "]:6 TL["tail"]:2
  space:4 UB["                    "]:5 space:4

  style SP fill:#87CEEB,stroke:#4FC3F7,color:#4FC3F7
  style HD fill:#546E7A,stroke:#37474F,color:#546E7A
  style BD fill:#607D8B,stroke:#455A64,color:#607D8B
  style MW fill:#546E7A,stroke:#37474F,color:#546E7A
  style BL fill:#78909C,stroke:#546E7A,color:#78909C
  style UB fill:#90A4AE,stroke:#607D8B,color:#90A4AE
  style TU fill:#455A64,stroke:#37474F,color:#455A64
  style TL fill:#546E7A,stroke:#37474F,color:#546E7A
  style EY fill:#111,stroke:#fff,color:#fff
```

## The Fish (system architecture)

Same fish, documented like enterprise software.

<div class="mermaid-animated" data-animate-order="Propulsion,TF,PF,CoreSystems,SC,SB,GL,Sensors,EY,LL,IO,MO">

```mermaid
flowchart LR
    subgraph Propulsion
        TF["Tail Fin\noscillation engine"]
        PF["Pectoral Fins\nsteering array"]
    end
    subgraph CoreSystems["Core Systems"]
        SC["Scales\narmor layer"]
        SB["Swim Bladder\nbuoyancy ctrl"]
        GL["Gills\nO2 extraction"]
    end
    subgraph Sensors
        EY(("Eye\ntarget acq"))
        LL["Lateral Line\nsonar"]
    end
    subgraph IO
        MO>"Mouth\nintake port"]
    end

    TF -->|thrust| SC
    PF -->|vector| SC
    SC -->|water flow| GL
    GL -->|oxygen| SB
    SB -->|depth signal| TF
    EY -->|visual data| PF
    LL -->|vibration| PF
    MO -->|food| GL
    EY -.->|threat detect| TF
```

</div>
