# ⚡ AI Productivity Agent

> Your personal AI employee — saves hours every day with multi-agent intelligence.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Stack](https://img.shields.io/badge/stack-HTML%2FCSS%2FJS-orange)

## 📑 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Modules](#modules)
- [AI Agents](#ai-agents)
- [Tech Stack](#tech-stack)
- [API Setup](#api-setup)
- [Data & Storage](#data--storage)
- [Customization](#customization)

---

## Overview

AI Productivity Agent is a **premium, production-ready** web application that acts as your personal AI employee. It combines **6 powerful modules** with a **multi-agent AI system** to help you research, study, manage tasks, run projects, generate documents, and track your productivity — all from one beautiful interface.

### Why This App?

- **All-in-one**: Research, study, tasks, projects, documents, and memory in one app
- **AI-Powered**: 4 specialized AI agents (Research, Study, Coding, Planning)
- **Free-Tier Compatible**: Uses Google Gemini API (free tier available)
- **Offline-First**: All data stored locally in localStorage
- **Privacy-Focused**: No backend, no tracking, your data stays with you
- **Beautiful UI**: Glassmorphism design with dark/light mode

---

## Features

### 🔍 AI Research Assistant
- **Deep Research Mode** — Quick, Standard, or Deep analysis
- **Multi-source Synthesis** — Combines information with citations
- **Report Generation** — Structured reports with save/export
- **Fact-Checking** — Verify claims with confidence levels
- **Saved Reports Library** — Access all past research

### 🎓 Study Assistant
- **Flashcard Generator** — Convert notes to interactive flashcards
- **Quiz Generator** — MCQ, True/False, Short Answer, Mixed
- **Mind Map Creator** — Hierarchical concept maps
- **Revision Planner** — Smart study schedules with daily breakdown
- **Concept Explainer** — Beginner to Advanced explanations
- **Subject Management** — Organize by subjects

### ✅ Task Automation Center
- **Task Management** — Add, complete, prioritize, filter
- **Daily Planner** — Auto-organized daily schedule
- **Goal Tracker** — SMART goals with progress tracking
- **AI Task Breakdown** — Convert goals into actionable steps
- **Progress Analytics** — Visual charts and streaks

### 📊 AI Project Manager
- **Project Breakdown** — AI-powered task decomposition
- **Milestone Tracking** — Visual milestone progress
- **Timeline Generation** — Automatic scheduling
- **Risk Analysis** — Identify and mitigate risks
- **Dashboard Integration** — All projects in one view

### 📄 Document Generator
- **Essays** — Academic, Persuasive, Narrative styles
- **Reports** — Business, Technical, Research formats
- **Presentations** — Slide-by-slide outlines
- **Study Notes** — Summary to detailed revision notes
- **Save & Export** — Copy, save, and manage documents

### 📈 Smart Dashboard
- **Productivity Score** — Real-time score with streaks
- **Weekly Charts** — Bar and doughnut chart analytics
- **Task Distribution** — Completed vs Pending
- **Recent Activity** — Timeline of all actions
- **Agent Quick Access** — One-click to any AI agent

### 🧠 Memory System
- **Remember Goals** — Persistent goal tracking
- **Remember Projects** — Project context preservation
- **Study Progress** — Automatic subject tracking
- **Quick Notes** — Save anything to memory

### 🎨 Modern UI
- **Glassmorphism Design** — Frosted glass aesthetics
- **Dark/Light Mode** — Full theme switching
- **Mobile Responsive** — Works on all devices
- **Command Palette** — ⌘K for quick navigation
- **Smooth Animations** — Professional transitions
- **Toast Notifications** — Clean feedback system

### 🤖 Advanced AI Features
- **Multi-Agent System** — 4 specialized agents
- **Auto-Routing** — Intelligent agent selection
- **Parallel Execution** — Run multiple agents at once
- **Streaming Responses** — Real-time AI output
- **Chat History** — Contextual conversations

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Browser (Client)                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │   HTML   │  │   CSS    │  │    JavaScript     │  │
│  │  (View)  │  │ (Styles) │  │   (Controllers)   │  │
│  └──────────┘  └──────────┘  └──────────────────┘  │
│                                      │               │
│                    ┌─────────────────┴──────────┐   │
│                    │     Module System           │   │
│                    │  Dashboard | Research | ... │   │
│                    └─────────────────┬──────────┘   │
│                                      │               │
│                    ┌─────────────────┴──────────┐   │
│                    │   Multi-Agent Orchestrator  │   │
│                    │  Research | Study | Code    │   │
│                    │       | Planning            │   │
│                    └─────────────────┬──────────┘   │
│                                      │               │
│                          ┌──────────┴──────────┐    │
│                          │   Gemini API Client  │    │
│                          └──────────┬──────────┘    │
│                                     │                │
│                          ┌──────────┴──────────┐    │
│                          │    localStorage      │    │
│                          │   (Data Persistence) │    │
│                          └─────────────────────┘    │
└─────────────────────────────────────────────────────┘
                          │
                          ▼
              ┌──────────────────────┐
              │  Google Gemini API   │
              │  (AI Backend)        │
              └──────────────────────┘
```

---

## Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, Edge)
- A Google Gemini API key (free tier available)

### Installation

1. **Clone or download** this project folder
2. **Open** `index.html` in your browser
3. **Get an API key** from [Google AI Studio](https://aistudio.google.com/apikey)
4. **Enter your key** in Settings (⚙️ → API Configuration)
5. **Start being productive!**

No build tools, no npm, no backend — just open the file and go.

### Quick Start Commands

| Action | Shortcut |
|--------|----------|
| Open Command Palette | `⌘K` / `Ctrl+K` |
| Navigate Pages | Sidebar menu |
| Toggle Theme | ⚙️ Settings or sidebar button |
| Toggle Sidebar | Sidebar toggle button |
| Close Modals | `Esc` key |

---

## Project Structure

```
ai-productivity-agent/
├── index.html                 # Main HTML entry point
├── css/
│   ├── variables.css          # CSS custom properties / design tokens
│   ├── reset.css              # CSS reset and base styles
│   ├── glassmorphism.css      # Glassmorphism design system
│   ├── layout.css             # Grid, flexbox, sidebar, topbar
│   ├── components.css         # Buttons, cards, modals, inputs
│   ├── animations.css         # Keyframe animations
│   ├── responsive.css         # Mobile/tablet responsive styles
│   └── themes.css             # Dark/light theme overrides
├── js/
│   ├── app.js                 # Main application controller
│   ├── utils/
│   │   ├── storage.js         # localStorage manager + data schema
│   │   ├── helpers.js         # Utility functions + DOM helpers
│   │   ├── api.js             # Gemini API client (call + stream)
│   │   └── toast.js           # Toast notification system
│   ├── agents/
│   │   ├── base-agent.js      # Base agent class
│   │   ├── research-agent.js  # Research agent (reports, facts)
│   │   ├── study-agent.js     # Study agent (flashcards, quiz)
│   │   ├── coding-agent.js    # Coding agent (code gen, review)
│   │   ├── planning-agent.js  # Planning agent (breakdown, goals)
│   │   └── multi-agent.js     # Multi-agent orchestrator
│   └── modules/
│       ├── dashboard.js       # Dashboard (stats, charts, activity)
│       ├── research.js        # Research (chat, reports, save)
│       ├── study.js           # Study (flashcards, quiz, mindmap)
│       ├── tasks.js           # Tasks (CRUD, planner, goals)
│       ├── projects.js        # Projects (breakdown, milestones)
│       ├── documents.js       # Documents (essay, report, notes)
│       └── memory.js          # Memory (goals, projects, notes)
├── assets/                    # Static assets (empty, for future use)
└── README.md                  # This documentation
```

---

## Modules

### Dashboard (`js/modules/dashboard.js`)

The landing page showing productivity overview:
- **Productivity Score** — Calculated from tasks completed, streak bonus
- **Weekly Progress Chart** — Bar chart of daily completions
- **Task Distribution** — Doughnut chart (completed vs pending)
- **Today's Plan** — Quick view of today's tasks
- **Agent Quick Actions** — One-click agent access
- **Recent Activity** — Timeline of all actions

### Research (`js/modules/research.js`)

Full-featured research interface:
- Chat-based interaction with Research Agent
- Depth selector (Quick/Standard/Deep)
- Saved reports library
- Quick research topic buttons
- Save/copy/export reports

### Study (`js/modules/study.js`)

Study tools organized in tabs:
- **Flashcards** — Generate from notes, flip through cards
- **Quiz** — Multiple question types, quiz history
- **Mind Map** — Hierarchical topic maps
- **Revision Planner** — Custom study schedules
- Subject management system

### Tasks (`js/modules/tasks.js`)

Task automation hub:
- Add tasks with priority and due date
- Filter (All/Pending/Done)
- Daily planner with progress bar
- Goal tracker with +/- progress controls
- AI-powered task breakdown

### Projects (`js/modules/projects.js`)

Project management with AI:
- Create projects manually or with AI
- Milestone tracking with checkboxes
- Task lists within projects
- Risk analysis generation
- Progress visualization

### Documents (`js/modules/documents.js`)

Document generation for 4 formats:
- **Essay** — Style selection, length control
- **Report** — Business/Technical/Research types
- **Presentation** — Slide outlines with speaker notes
- **Study Notes** — Various detail levels
- Save, copy, and document library management

### Memory (`js/modules/memory.js`)

Persistent memory system:
- Remembered goals with progress tracking
- Remembered projects with status
- Study progress auto-tracking
- Quick notes functionality

---

## AI Agents

### Research Agent (`research-agent.js`)
```
Capabilities: Deep research, fact-checking, report generation,
              web synthesis, source citation, summarization
System Prompt: Structured research methodology with citations
```

### Study Agent (`study-agent.js`)
```
Capabilities: Flashcard generation, quiz creation, mind maps,
              revision planning, concept explanation
System Prompt: Educational best practices, varied question types
```

### Coding Agent (`coding-agent.js`)
```
Capabilities: Code generation, code review, debugging,
              architecture suggestions
System Prompt: Best practices, error handling, language conventions
```

### Planning Agent (`planning-agent.js`)
```
Capabilities: Project breakdown, daily planning, risk analysis,
              goal setting (SMART), timeline generation
System Prompt: Practical, realistic, Eisenhower Matrix, 80/20 rule
```

### Multi-Agent Orchestrator (`multi-agent.js`)
```
Manages all agents, auto-routes requests, supports:
- Parallel execution of multiple agents
- Streaming and non-streaming responses
- Session-based chat history
```

---

## Tech Stack

| Technology | Purpose |
|-----------|---------|
| **HTML5** | Semantic structure, accessibility |
| **CSS3** | Glassmorphism, animations, responsive |
| **JavaScript (ES6+)** | All application logic |
| **Chart.js** | Dashboard charts (bar, doughnut) |
| **Marked.js** | Markdown rendering for AI responses |
| **Font Awesome 6** | Icons throughout the UI |
| **Google Gemini API** | AI backend (free tier compatible) |
| **localStorage** | All data persistence |

**No frameworks, no build tools, no backend required.**

---

## API Setup

### Getting a Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key

### Adding to the App

1. Click the ⚙️ Settings icon in the sidebar
2. Paste your key in the "Gemini API Key" field
3. Click "Save API Key"
4. The 🔑 icon in the top bar will turn green

### Free Tier Limitations

- **gemini-2.5-flash**: 15 requests per minute, 1,500 requests per day
- **gemini-2.5-pro**: Limited free quota
- The app defaults to `gemini-2.5-flash` for cost efficiency

### Changing Models

Edit the default model in `js/utils/api.js`:
```javascript
// Line ~24
model = 'gemini-2.5-flash',  // Change to 'gemini-2.5-pro' for better quality
```

---

## Data & Storage

### Storage Structure

All data is stored in `localStorage` under the `aiagent_` prefix:

```
aiagent_initialized       → Boolean (first-run flag)
aiagent_tasks             → Array of task objects
aiagent_projects          → Array of project objects
aiagent_goals             → Array of goal objects
aiagent_studySubjects     → Array of subject objects
aiagent_flashcards        → Object { subjectId: [cards] }
aiagent_quizResults       → Array of quiz result objects
aiagent_researchReports   → Array of report objects
aiagent_documents         → Array of document objects
aiagent_dailyPlans        → Object { date: plan }
aiagent_analytics         → Object (streaks, counts)
aiagent_memory            → Object (goals, projects, progress, notes)
aiagent_gemini_api_key    → String (API key)
aiagent_theme             → String ('dark' | 'light')
aiagent_current_page      → String (current page)
```

### Data Management

- **Export**: Settings → Export All Data (downloads JSON)
- **Import**: Settings → Import Data (restores from JSON backup)
- **Clear**: Settings → Clear All Data (full reset)

### Privacy

- All data stays in your browser's localStorage
- No data is sent to any server except the Gemini API (for AI features)
- API key is stored locally and only used for Gemini API calls

---

## Customization

### Changing Colors

Edit `css/variables.css`:
```css
--primary: #6c5ce7;    /* Main brand color */
--accent: #00cec9;     /* Secondary accent */
--success: #00b894;    /* Success/complete color */
```

### Changing Default Theme

Edit `js/app.js`:
```javascript
const savedTheme = Storage.get('theme', 'dark'); // Change to 'light'
```

### Adding New Pages

1. Create a new module in `js/modules/`
2. Add to the `App.modules` object in `js/app.js`
3. Add a nav item in `index.html`
4. Add titles mapping in `App.navigate()`

---

## Browser Support

| Browser | Support |
|---------|---------|
| Chrome 90+ | ✅ Full |
| Firefox 90+ | ✅ Full |
| Safari 15+ | ✅ Full |
| Edge 90+ | ✅ Full |
| Mobile Chrome | ✅ Full |
| Mobile Safari | ✅ Full |

---

## Performance

- **Initial Load**: ~200KB (gzipped), loads in <1s
- **CDN Dependencies**: Chart.js, Marked, Font Awesome (cached)
- **No Build Step**: Zero compilation, instant iteration
- **Efficient DOM**: Virtual list-like task rendering
- **Lazy Charts**: Charts destroyed and recreated to prevent memory leaks

---

## License

MIT License — free for personal and commercial use.

---

## Credits

Built with ❤️ using pure HTML, CSS, and JavaScript.

- **Icons**: [Font Awesome](https://fontawesome.com)
- **Charts**: [Chart.js](https://chartjs.org)
- **Markdown**: [Marked.js](https://marked.js.org)
- **AI**: [Google Gemini](https://ai.google.dev)

---

**⚡ Start saving hours every day with your AI Productivity Agent!**
