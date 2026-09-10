<p align="center">
  <img src="docs/assets/hej-swedish-training-banner.png" alt="hej! Swedish Training" width="100%" />
</p>

<h1 align="center">hej! Swedish Training</h1>

<p align="center">
  <a href="README.md">中文</a> | English
</p>

<p align="center">Practice Swedish through typing, sound, and everyday situations.</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=111827" alt="React 18" />
  <img src="https://img.shields.io/badge/TypeScript-4.9-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Web%20Speech-API-F7C948?style=flat-square" alt="Web Speech API" />
  <img src="https://img.shields.io/badge/Storage-localStorage-2858C8?style=flat-square" alt="localStorage" />
  <img src="https://img.shields.io/badge/License-GPL--3.0-1F2937?style=flat-square" alt="GPL-3.0" />
</p>

The Swedish training modules used in `hej!`. Each expression returns through whole-sentence typing, active recall, listening, and speaking instead of appearing as an isolated vocabulary item.

## Features

- Copy typing, Chinese-to-Swedish recall, listening, and sentence completion
- Whole-sentence submission with word-level error location
- Memory training through context, copying, active recall, listening extraction, and delayed checks
- Speaking practice with shadowing, recording, playback, situational responses, and personalised variations
- Simulations based on everyday situations in Sweden
- Swedish course data and a 1,000-expression daily-language course pack
- Plain-key fallbacks: `a` for `å / ä` and `o` for `ö`
- Browser speech, keyboard feedback, mistake callbacks, favourites, and resumable sessions

## Training Flow

```mermaid
flowchart LR
    A["Swedish course"] --> B{"Choose a route"}
    B --> C["Memory"]
    B --> D["Speaking"]
    B --> E["Free practice"]
    C --> C1["Understand"] --> C2["Copy"] --> C3["Recall"] --> C4["Listen"] --> C5["Delayed check"]
    D --> D1["Listen and shadow"] --> D2["Record and replay"] --> D3["Respond in context"] --> D4["Create a variation"]
    E --> E1["Copy / translate / listen / complete"]
    C5 --> F["Session result"]
    D4 --> F
    E1 --> F
    F --> G["Mistakes · favourites · review"]
```

## Tech Stack

| Area | Technology | Purpose |
| --- | --- | --- |
| Components | React 18 | Training state and interactions |
| Types | TypeScript | Course, phrase, progress, and component types |
| Speech | Web Speech API | Swedish word and sentence playback |
| Recording | MediaRecorder API | Speaking capture and replay |
| Sound | Web Audio API | Keyboard and answer feedback |
| Animation | Canvas Confetti | Completion feedback |
| Icons | Lucide React | Interface icons |
| Content | JSON + TypeScript | Course packs and schemas |
| Storage | localStorage | Progress and resumable sessions |
| Styling | CSS | Desktop and mobile training layouts |

## Source Layout

```text
src/
├── course-packs/
│   ├── premium-daily-1000.json
│   └── schema.ts
├── TypingTrainer.tsx
├── LearningJourney.tsx
├── ScenarioSimulation.tsx
├── swedish-data.ts
├── typing-comparison.ts
├── typing-sound.ts
├── speech.ts
├── i18n.tsx
├── learning-language.tsx
├── KineticLoader.tsx
└── training.css
```

## License

[GNU General Public License v3.0](LICENSE)
