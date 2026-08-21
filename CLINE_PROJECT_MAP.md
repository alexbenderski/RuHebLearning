# RuHebStudy — Cline Project Map & Onboarding Guide

Welcome! This document is the **Project Map and System Guide** for **RuHebStudy** (Russian-Hebrew learning platform).
Whenever you open a new chat session or need to perform maintenance, feature additions, or debugging, reference this document to instantly align your search, avoid expensive context rebuilds, and pinpoint files with mathematical precision.

⚠️ **CRITICAL INSTRUCTION FOR ALL AI ASSISTANTS / CLINE:**
Always **READ this file completely (`CLINE_PROJECT_MAP.md`)** before you write any code or start searching files. It serves as your memory cache and project map to optimize search path algorithms and avoid redundant scanning.

---

## 🚀 1. Tech Stack Overview

- **Frontend:** React 19, TypeScript 6, Vite 8, React Router Dom 7, CSS Modules, Firebase Client SDK (v12)
- **Backend:** Express 4, tsx, ts-node/typescript, Google Auth Library, `@google/generative-ai` (Gemini), `firebase-admin`
- **Database/Auth:** Google Firebase Firestore, Firebase Authentication
- **External Integrations:** Google TTS (Text-To-Speech) via Cloud Service Account API, Gemini API (for advanced AI translation/content)

---

## 📁 2. Workspace Directory Structure

Use this structural map to locate modules quickly.

```text
RuHebStudy/ (Root)
├── package.json                   # Root dependencies (React 19, Vite, Firebase client)
├── tsconfig.json                  # TypeScript base config
├── vite.config.ts                 # Vite setup
├── index.html                     # App HTML mount point
├── CLINE_PROJECT_MAP.md           # This onboarding file (KEEP UPDATED!)
│
├── server/                        # Express Backend Server
│   ├── package.json               # Backend dependencies (express, cors, google-auth, tsx)
│   ├── tsconfig.json              # Backend TypeScript config
│   ├── .env.example / .env        # API keys, Port configurations, Firebase Admin Config
│   └── src/
│       ├── index.ts               # Server entry point (starts server at http://localhost:3001)
│       ├── lib/
│       │   └── firebaseAdmin.ts   # Firebase Admin initialization
│       └── routes/
│           └── tts.ts             # Google TTS routes / text-to-speech engine endpoint
│
└── src/                           # React Frontend Client
    ├── main.tsx                   # Client entry point
    ├── App.tsx                    # Route Definitions (/alphabet, /words, /my-words, /)
    ├── App.css / index.css        # Global CSS styles
    │
    ├── assets/                    # Images, SVGs, static assets
    │
    ├── components/                # Modular React Components & CSS Modules
    │   ├── alphabet/              # Alphabet Games & Lessons
    │   │   ├── AlphabetMemoryGame.tsx / .module.css
    │   │   ├── AlphabetModule.tsx / .module.css          # Tab coordinator for alphabet
    │   │   ├── AlphabetQuiz.tsx / .module.css
    │   │   ├── AlphabetWordBuilderGame.tsx / .module.css
    │   │   └── LetterCard.tsx / .module.css
    │   │
    │   ├── grammar/               # Grammar Games & Interactive Lessons
    │   │   ├── GrammarModule.tsx                         # Core Grammar component with 4 interactive games
    │   │   └── GrammarModule.module.css
    │   │
    │   ├── layout/                # General Layout & Navigation
    │   │   ├── Layout.tsx / .module.css
    │   │   └── Navbar.tsx / .module.css
    │   │
    │   ├── story/                 # Story Mode Module
    │   │   └── StoryMode.tsx / .module.css
    │   │
    │   └── words/                 # Vocabulary Games & Flashcards
    │       ├── FlashCard.tsx / .module.css
    │       ├── WordsDragBuilderGame.tsx / .module.css
    │       ├── WordsMemoryGame.tsx / .module.css
    │       ├── WordsModule.tsx / .module.css             # Tab coordinator for words
    │       └── WordsQuiz.tsx / .module.css
    │
    ├── data/                      # Static Application Core Data
    │   ├── alphabet.ts            # HebrewLetter dictionary data (32 items)
    │   └── vocabulary.ts          # Words database grouped by categories & difficulties
    │
    ├── firebase/                  # Client Firebase Integration
    │   ├── config.ts              # Firebase client SDK initialization config
    │   ├── authService.ts         # User signup/signin functions
    │   └── userService.ts         # Fetching/updating user profiles, points, streaks
    │
    ├── hooks/                     # Custom React Hooks
    │   ├── useCloudTTS.ts         # Logic for playing TTS utilizing the Express Server route
    │   ├── useGameTimer.ts        # Reusable timer logic for games
    │   ├── useProgressTracker.ts  # Handles Firestore progress & stats sync for modules
    │   ├── useTTS.ts              # Synthesizer interface abstraction
    │   └── useUser.ts             # React context wrapper for authentication state and Profile loading
    │
    ├── pages/                     # Routed Main Pages
    │   ├── AuthGate.tsx / .module.css      # Login, registration, and password recovery interface
    │   ├── Home.tsx / .module.css          # Main Dashboard
    │   └── MyWordsPage.tsx / .module.css   # Saved words database & progress statistics
    │
    └── types/                     # Shared TypeScript Interface Declarations
        └── index.ts               # Core Database and Application types (HebrewLetter, VocabWord, UserProfile)
```

---

## 🎯 3. File Finder Algorithms (How to target specific files)

Whenever you have a user request, match the request category below to find exactly which files to edit or read.

| User Request Objective | Files to Inspect & Modify | Action Strategy / Notes |
| :--- | :--- | :--- |
| **Manage routing, navbar items, or header/footer layout** | `src/App.tsx`<br>`src/components/layout/Navbar.tsx`<br>`src/components/layout/Layout.tsx` | App.tsx handles react-router routes. Navbar.tsx holds the page menu. Layout.tsx holds the sidebar/wrapping view. |
| **Modify Hebrew letters list or phonetics** | `src/data/alphabet.ts`<br>`src/types/index.ts` | The type structure is `HebrewLetter` in `src/types/index.ts`. All actual records live in `src/data/alphabet.ts`. |
| **Modify standard Vocabulary words / Categories** | `src/data/vocabulary.ts`<br>`src/types/index.ts` | Standard categories and items live here. Modifying difficulties (`easy`, `medium`, `hard`) is defined by `WordDifficulty` in types. |
| **Change scoring, level points, streaks, or DB collections** | `src/types/index.ts`<br>`src/firebase/userService.ts`<br>`src/hooks/useProgressTracker.ts` | All Firestore collection constants are prefixed with `RuHeb_` inside `src/types/index.ts`. User profile point rules are handled inside `userService.ts`. |
| **Modify registration / login experience** | `src/pages/AuthGate.tsx`<br>`src/firebase/authService.ts`<br>`src/hooks/useUser.ts` | Handles email / password registration, login modes, error messaging, and auth states. |
| **Modify text-to-speech audio pronunciation** | `src/hooks/useCloudTTS.ts`<br>`server/src/routes/tts.ts` | Frontend calls `useCloudTTS.ts` which performs a fetch POST request to the server API endpoint `/api/tts/synthesize`. |
| **Create or change an Alphabet practice game** | `src/components/alphabet/` | Contains the games: `AlphabetMemoryGame.tsx` (card flipping matching game), `AlphabetQuiz.tsx` (multiple choice), `AlphabetWordBuilderGame.tsx` (combining letters to form words), and `AlphabetModule.tsx` (main tab selector). |
| **Create or change a Vocabulary practice game** | `src/components/words/` | Contains games: `WordsMemoryGame.tsx` (cards matching Hebrew with Russian translation), `WordsQuiz.tsx` (multiple choice), `WordsDragBuilderGame.tsx` (reordering letters to translate a card), `FlashCard.tsx` (vocabulary cards with mnemonic guides), and `WordsModule.tsx` (tab manager). |
| **Practice Grammar (Nikud, Gender, Prefix, Roots)** | `src/components/grammar/GrammarModule.tsx`<br>`src/components/grammar/GrammarModule.module.css` | Handles vowels matching, gender sorting game, prefix simulator, and root letter scanners. |
| **Update look, layout, colors, or animations** | Nearby `*.module.css` file matching the `.tsx` component | This project strictly utilizes CSS Modules to isolate class scopes. **Do not write global rules in component styles; always modify the corresponding `.module.css`.** |

---

## ⚡ 4. Developer Run Guide

These commands are used to quickly control and run the application stack:

### Frontend (Vite Client)
```bash
# In Root directory
npm install      # Installs frontend dependencies
npm run dev      # Starts Vite dev server (usually http://localhost:5173)
npm run build    # Builds frontend into /dist folder
npm run lint     # Runs oxlint static analyzer
```

### Backend (Express Server)
```bash
# In server/ directory
cd server
npm install      # Installs backend dependencies
npm run dev      # Starts tsx development watching server (http://localhost:3001)
npm run build    # Compiles server code to JavaScript
npm run start    # Runs production build from server/dist/index.js
```

---

## 🛡️ 5. Rules of Engagement for Cline (AI Memory Core)

Keep these architecture rules in mind during every feature request:
1. **Never use Global CSS classes for React components.** Every UI component has a companion `.module.css` file. Utilize `import styles from './MyComponent.module.css';` and apply them with `className={styles.container}`.
2. **Respect the Database Prefix.** All root Firestore collection names must refer to the constants in `src/types/index.ts`. Their real database names are prefixed with `RuHeb_` to prevent collisions.
3. **Handle Errors Cleanly.** On the backend (`server/src/routes/tts.ts`), ensure files/directories/tokens are checked before operations, throwing proper JSON error messages. On the frontend, prevent application crashes by matching error messages gracefully.
4. **Strict Types.** Avoid using `any` type. Update `src/types/index.ts` first if any data structures or game stats are modified, and then propagate these changes to components.
5. **Targeted Edits Only & No Truncation.** DO NOT rewrite or replace the entire file unless explicitly requested. Use the `replace_in_file` tool to strictly modify ONLY the specific lines that need to be changed. However, when providing the replacement block for those specific lines, provide the exact and complete modified lines without using `// ...` placeholders. Always double-check matching syntax.
---
## 📝 6. Data Standards & Schema Rules (Adding New Content)

Whenever you are asked to generate or add new vocabulary words to `src/data/vocabulary.ts`, you MUST structure each word with the following strictly required fields:

1. **Base Word (`wordHebrew`):** Written in Modern Israeli "Ktiv Male" (full spelling with Vav and Yod, e.g., שולחן instead of שלחן).
2. **Vowels (`wordVowels`):** The precisely vowelized version (Nikud), adhering to the linguistic rules in section 7.
3. **Translation (`translation` / `russian`):** Accurate Russian translation.
4. **Transcription (`transcription`):** Russian Cyrillic transcription of the pronunciation (e.g., "шульхан").
5. **Grammar Explanation (`grammarExplanation`):** A short, friendly explanation in Russian detailing the morphology, the Root (Шореш - שורש), specific Nikud choices, and any suffixes/prefixes.

## 🧠 7. Linguistic & Pedagogical Rules (Hebrew Grammar)

Our application strictly teaches **Modern Spoken Israeli Hebrew**. When writing code, generating words, or updating the grammar section, ALWAYS apply these exact filtering rules:

* **Ktiv Male First:** Always assume and write in full spelling (כתיב מלא). 
* **Obsolete Vowels (REMOVE):** 
  - NEVER use 'Kubutz' (ֻ) or 'Holam Haser' (◌ֹ). Replace them with 'Shuruk' (וּ) and 'Holam Male' (וֹ) respectively.
  - DO NOT use 'Hatafim' (ֲ, ֱ, ֳ) as interactive choices in games; they sound identical to standard short vowels (ַ, ֶ, ָ) in modern Hebrew[cite: 4, 9].
* **Dagesh (Inner Dot) Rules:**
  - STRICTLY REMOVE the Dagesh from all letters where it does NOT change modern pronunciation (remove from גּ, דּ, תּ, טּ, קּ, לּ, מּ, נּ, etc.)[cite: 4, 9].
  - STRICTLY KEEP the Dagesh ONLY in these three letters: **בּ (B/V), כּ (K/Kh), and פּ (P/F)**[cite: 4, 9].
  - STRICTLY KEEP the top dot distinction for **שׁ (Sh) and שׂ (S)**[cite: 4, 9].

## 8. **Strict Linter & Unused Variables Cleanup (Vercel Build Requirement).** You MUST actively remove any unused variables, unused imports, or dead code you encounter or generate while editing. Leaving unused elements triggers strict TypeScript and ESLint errors that will immediately cause the Vercel production build to fail. Always clean up your code and resolve all warnings before completing a task.

*This document was created automatically as a roadmap. Please update this file if you add new folders, files, routes, or services so that subsequent Cline/AI sessions remain 100% synchronized with the project architecture.*
