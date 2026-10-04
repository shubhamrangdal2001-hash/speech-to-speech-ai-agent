# 🎙️ Aria — Speech-to-Speech AI Voice Agent

> A real-time, browser-native voice AI agent powered by **Google Gemini 2.5 Flash**. Speak naturally, and Aria listens, reasons, and responds aloud — no backend server required.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react)
![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite)
![Gemini](https://img.shields.io/badge/Gemini-2.5--Flash-4285F4?logo=google)
![License](https://img.shields.io/badge/license-MIT-green)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [High-Level Design (HLD)](#-high-level-design-hld)
  - [System Architecture](#system-architecture)
  - [Data Flow Diagram](#data-flow-diagram)
  - [Component Architecture](#component-architecture)
  - [State Machine](#state-machine)
  - [Module Responsibilities](#module-responsibilities)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Configuration](#configuration)
  - [Running the App](#running-the-app)
- [Usage Guide](#-usage-guide)
- [Configuration Reference](#-configuration-reference)
- [Browser Compatibility](#-browser-compatibility)
- [Architecture Decisions](#-architecture-decisions)
- [Limitations](#-limitations)

---

## 🌟 Overview

**Aria** is a fully browser-native, real-time speech-to-speech AI assistant built with React and Vite. It establishes a continuous voice conversation loop:

```
User speaks → Browser STT → Gemini LLM → Browser TTS → User hears
```

All processing is coordinated client-side. There is **no custom backend** — the app communicates directly with the Gemini REST API using your API key, making it extremely lightweight to deploy.

---

## ✨ Features

| Feature | Description |
|--------|-------------|
| 🎤 **Real-time STT** | Web Speech API with interim transcript display |
| 🤖 **Gemini 2.5 Flash** | Low-latency LLM inference via direct REST calls |
| 🔊 **Browser TTS** | SpeechSynthesis API with configurable voice, rate, and pitch |
| 🛑 **Barge-in / Interrupt** | User can interrupt the agent mid-speech |
| ⌨️ **Text Fallback** | Full keyboard input when voice isn't available |
| 🔄 **Multi-turn Context** | Full conversation history sent with each request |
| 🌐 **Multi-lingual** | Auto-detect and respond in the user's language |
| 💫 **Animated Orb UI** | Visual status indicator (idle / listening / thinking / speaking / error) |
| 🔒 **Safe by default** | API key stays client-side; declines harmful requests per system prompt |

---

## 🏗️ High-Level Design (HLD)

### System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser (Client)                          │
│                                                                   │
│  ┌─────────────┐    ┌──────────────────┐    ┌───────────────┐   │
│  │  Microphone │───▶│  Web Speech API  │───▶│ useSpeech-    │   │
│  │  (Hardware) │    │  (Recognition)   │    │ Recognition   │   │
│  └─────────────┘    └──────────────────┘    └───────┬───────┘   │
│                                                      │           │
│                                              final transcript    │
│                                                      ▼           │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   useConversation (Hook)                  │   │
│  │                                                            │   │
│  │   ┌──────────────┐      ┌──────────────┐                  │   │
│  │   │  State Mgmt  │      │  Message     │                  │   │
│  │   │  (useReducer)│      │  History     │                  │   │
│  │   └──────┬───────┘      └──────┬───────┘                  │   │
│  │          │                     │                           │   │
│  │          └──────────┬──────────┘                           │   │
│  │                     ▼                                       │   │
│  │              sendToAI (apiClient)                           │   │
│  └──────────────────────┬───────────────────────────────────┘   │
│                          │                                        │
│                          │ HTTPS REST                             │
└──────────────────────────┼────────────────────────────────────────┘
                           │
                 ┌─────────▼─────────┐
                 │   Google Gemini   │
                 │   2.5 Flash API   │
                 │  (generateContent)│
                 └─────────┬─────────┘
                           │
┌──────────────────────────┼────────────────────────────────────────┐
│                          │        Browser (Client, cont.)          │
│                          ▼                                         │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │              useSpeechSynthesis (TTS Hook)                │    │
│  └──────────────────────┬───────────────────────────────────┘    │
│                          │                                         │
│                          ▼                                         │
│  ┌──────────────────────────────────┐                             │
│  │  Web Speech API (SpeechSynthesis)│                             │
│  └──────────────────────┬───────────┘                             │
│                          ▼                                         │
│                    🔊 Speaker Output                               │
└────────────────────────────────────────────────────────────────────┘
```

---

### Data Flow Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                    SPEECH-TO-SPEECH PIPELINE                      │
└──────────────────────────────────────────────────────────────────┘

  User Speaks
      │
      ▼
┌─────────────┐
│  Web Speech │  SpeechRecognition API
│  Recognition│  • continuous = true
│  (STT)      │  • interimResults = true
│             │  • silenceTimeout = 1800ms
└──────┬──────┘
       │
       │  Interim transcript (live display)
       ├──────────────────────────────────▶ StatusBar / interimText
       │
       │  Final transcript (after silence timeout)
       ▼
┌─────────────┐
│ handleUser  │  useConversation.js
│ Speech()    │  • Stops mic + any ongoing speech
│             │  • Adds user message to UI
│             │  • Dispatches SET_STATUS → "thinking"
└──────┬──────┘
       │
       │  Build conversation history
       ▼
┌─────────────┐
│ sendToAI()  │  apiClient.js
│             │  • Formats messages → Gemini `contents` format
│             │  • Injects SYSTEM_PROMPT as system_instruction
│             │  • POST to Gemini REST API
│             │  • maxOutputTokens: 1000, temperature: 1.0
└──────┬──────┘
       │
       │  { candidates[0].content.parts[].text }
       ▼
┌─────────────┐
│ AI Reply    │  useConversation.js
│ Handler     │  • Adds assistant message to UI
│             │  • Dispatches SET_STATUS → "speaking"
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ speak()     │  useSpeechSynthesis (App.jsx)
│ (TTS)       │  • SpeechSynthesisUtterance
│             │  • Preferred voice selection
│             │  • onEnd → SET_STATUS → "idle"
└──────┬──────┘
       │
       ▼
  🔊 User Hears Response
       │
       └──── Loop continues (user speaks again)
```

---

### Component Architecture

```
App.jsx  (Root Orchestrator)
├── useSpeechSynthesis()       ← TTS hook (inline, App.jsx)
├── useSpeechRecognition()     ← STT hook (useSpeechRecognition.js)
├── useConversation()          ← Core state + AI bridge (useConversation.js)
│
├── <AgentOrb />               ← Animated status orb
│     └── statusConfig         ← Per-state colors, animations
│
├── <StatusBar />              ← Text status + interim transcript
│
├── <MessageBubble />          ← Individual chat bubble (user/assistant)
│   (rendered per message[])
│
└── <ControlPanel />           ← Mic button + text input + controls
      ├── onToggleMic()        → conversation.toggleListening()
      ├── onInterrupt()        → conversation.interrupt()
      ├── onClear()            → conversation.clearSession()
      └── onTextSubmit()       → conversation.handleTextInput()
```

---

### State Machine

The agent cycles through 5 distinct states managed by `useReducer` in `useConversation.js`:

```
                    ┌──────────────────────────────┐
                    │                              │
              ┌─────▼──────┐                       │
        ┌────▶│    IDLE    │◀────────────────────┐ │
        │     └─────┬──────┘                     │ │
        │           │  User presses mic          │ │
        │           ▼                            │ │
        │     ┌─────────────┐                    │ │
        │     │  LISTENING  │                    │ │
        │     └──────┬──────┘                    │ │
        │            │  Final transcript          │ │
        │            ▼                            │ │
        │     ┌─────────────┐                    │ │
        │     │  THINKING   │  (API in-flight)   │ │
        │     └──────┬──────┘                    │ │
        │            │  Reply received            │ │
        │            ▼                            │ │
        │     ┌─────────────┐                    │ │
        │     │  SPEAKING   │──── TTS ends ──────┘ │
        │     └──────┬──────┘                       │
        │            │  User interrupts             │
        └────────────┘                              │
                                                    │
        ┌─────────────┐                             │
        │    ERROR    │─────── fallback TTS ends ───┘
        └─────────────┘
```

| State | Orb Color | Description |
|-------|-----------|-------------|
| `idle` | 🔵 Blue | Ready and waiting for input |
| `listening` | 🟢 Teal | Microphone active, STT running |
| `thinking` | 🟣 Purple | Gemini API request in-flight |
| `speaking` | 🔵 Blue (pulse) | TTS playing the AI response |
| `error` | 🔴 Red | API or recognition failure |

---

### Module Responsibilities

| Module | Role |
|--------|------|
| `App.jsx` | Root component; wires all hooks together; renders layout |
| `useConversation.js` | Core business logic; state machine; coordinates STT→LLM→TTS pipeline |
| `useSpeechRecognition.js` | Wraps Web Speech API recognition; manages silence timeout & interim results |
| `apiClient.js` | Formats messages to Gemini format; handles fetch, error handling, response parsing |
| `agentConfig.js` | Single source of truth for agent identity, system prompt, API config, speech config |
| `AgentOrb.jsx` | Visual animated orb reflecting current agent state |
| `ControlPanel.jsx` | Mic toggle, interrupt, text input fallback, clear session |
| `MessageBubble.jsx` | Renders individual user/assistant message in the chat feed |
| `StatusBar.jsx` | Displays live status label and interim transcript text |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **UI Framework** | React 18.3 |
| **Build Tool** | Vite 5.4 |
| **LLM** | Google Gemini 2.5 Flash (REST API) |
| **Speech-to-Text** | Web Speech API (`SpeechRecognition`) |
| **Text-to-Speech** | Web Speech API (`SpeechSynthesis`) |
| **Styling** | Vanilla CSS (CSS Variables, animations) |
| **Icons** | Inline SVG (zero dependencies) |
| **State Management** | React `useReducer` |
| **Deployment** | Any static host (Vercel, Netlify, GitHub Pages) |

---

## 📁 Project Structure

```
Project_Speech to Speech/
├── index.html               # HTML entry point, loads fonts
├── main.jsx                 # React root mount
├── App.jsx                  # Root component + TTS hook
├── global.css               # CSS variables, global styles, keyframe animations
│
├── agentConfig.js           # ⚙️ All configuration (agent, API, speech)
├── apiClient.js             # 🌐 Gemini API client
├── useConversation.js       # 🧠 Core conversation state machine
├── useSpeechRecognition.js  # 🎤 STT hook (Web Speech API)
│
├── AgentOrb.jsx             # 💫 Animated status orb
├── ControlPanel.jsx         # 🎛️ Mic button + text input controls
├── MessageBubble.jsx        # 💬 Chat message component
├── StatusBar.jsx            # 📊 Status label + interim text display
│
├── .env                     # 🔑 Environment variables (API key)
├── vite.config.js           # Vite configuration
└── package.json             # Project metadata and dependencies
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18 ([download](https://nodejs.org/))
- **npm** ≥ 9
- A modern browser with Web Speech API support (Chrome / Edge recommended)
- A **Google Gemini API key** ([get one free](https://aistudio.google.com/app/apikey))

### Installation

```bash
# 1. Clone or download the project
cd "Project_Speech to Speech"

# 2. Install dependencies
npm install
```

### Configuration

Create or edit the `.env` file in the project root:

```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

> ⚠️ **Important:** The `VITE_` prefix is required for Vite to expose the variable to the browser. Never commit your actual API key to version control.

### Running the App

```bash
# Start the development server
npm run dev
```

Open your browser at **http://localhost:5173**

```bash
# Build for production
npm run build

# Preview the production build
npm run preview
```

---

## 📖 Usage Guide

1. **Open the app** in Chrome or Edge (best Web Speech API support)
2. **Click "START SESSION"** — Aria will greet you with a spoken introduction
3. **Click the mic button** (blue circle) to begin speaking
4. **Speak naturally** — the interim transcript appears in real time below the orb
5. **Pause for ~1.8 seconds** — silence is detected and your speech is sent to Aria
6. **Aria responds** — text appears in the chat and is read aloud
7. **Interrupt anytime** — click the mic/stop button while Aria is speaking
8. **Use text input** — type and press Enter or click Send as an alternative to voice
9. **Clear session** — click the trash icon to reset the conversation

---

## ⚙️ Configuration Reference

All configuration lives in `agentConfig.js`:

### Agent Identity (`AGENT_CONFIG`)

```js
{
  name: 'Aria',
  voiceTone: 'Warm, Professional, Energetic',
  domainFocus: 'General Assistant',
  language: 'Auto-detect',
  responseSpeed: 'Fast & brief',
  greeting: "Hey! I'm Aria...",
}
```

### API Configuration (`API_CONFIG`)

```js
{
  model: 'gemini-2.5-flash',   // Gemini model to use
  max_tokens: 1000,             // Max response length
}
```

### Speech Configuration (`SPEECH_CONFIG`)

```js
recognition: {
  continuous: false,
  interimResults: true,
  lang: 'en-US',
  silenceTimeout: 1800,         // ms of silence before auto-submit
},
synthesis: {
  rate: 1.05,                   // TTS speed (1.0 = normal)
  pitch: 1.0,                   // TTS pitch
  volume: 1.0,
  preferredVoices: ['Samantha', 'Google US English', 'Microsoft Aria'],
}
```

---

## 🌐 Browser Compatibility

| Browser | Voice Input | Voice Output | Notes |
|---------|-------------|--------------|-------|
| Chrome 90+ | ✅ Full | ✅ Full | **Recommended** |
| Edge 90+ | ✅ Full | ✅ Full | Recommended |
| Firefox | ❌ Limited | ✅ Partial | STT not supported |
| Safari 15+ | ⚠️ Partial | ✅ Full | Requires HTTPS |
| Mobile Chrome | ✅ Full | ✅ Full | Works well |

> The app gracefully degrades to **text-only mode** when speech recognition is unavailable.

---

## 🧩 Architecture Decisions

**Why no backend?**
The app is intentionally serverless. The Gemini API is called directly from the browser, keeping the architecture simple and removing the need for deployment infrastructure. This is suitable for personal or demo use; for production, proxying the API key through a server is recommended.

**Why `useReducer` for state?**
The conversation state has several interdependent fields (`messages`, `agentStatus`, `error`, `sessionStarted`) that change atomically on events. `useReducer` provides clear, traceable state transitions that map directly to the agent's state machine.

**Why `useRef` for `processingRef`?**
To prevent double-submission without triggering re-renders. A flag that guards against concurrent API calls doesn't need to be reactive state.

**Why inline TTS hook in App.jsx?**
`useSpeechSynthesis` is a thin wrapper around a browser API with no internal state beyond a ref. It's kept inline to avoid over-abstracting simple utilities.

---

## ⚠️ Limitations

- **API key exposed client-side**: The Gemini key is bundled in the frontend. For public deployments, use a proxy server to keep the key secure.
- **Browser-only**: Relies on Web Speech API, which is not available in Node.js or all browsers.
- **No persistent memory**: Conversation history is in-memory only and resets on page refresh.
- **STT language**: Defaults to `en-US`; change `SPEECH_CONFIG.recognition.lang` for other languages.
- **Rate limits**: Subject to Gemini API quotas on your account.

---

## 📄 License

MIT License — feel free to use, modify, and distribute.

---

<div align="center">
  Built with ❤️ using React · Vite · Google Gemini
</div>
