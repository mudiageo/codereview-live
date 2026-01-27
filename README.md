# CodeReview.live – Async Video Code Reviews

## Inspiration

We've all been there: hours spent on code review, dozens of text comments—and still, confusion lingers. Text alone lacks context, emotion, and clarity.  
**CodeReview.live** was born from the insight that a 2-minute video can replace 20 minutes of typing, making code review more human and effective. Inspired by CodeSpring’s “renewal” theme, we’re transforming developer communication from frustrating text exchanges to clear, async video conversations.

---

## What It Does

**CodeReview.live** transforms code reviews into async video walkthroughs with a suite of modern collaboration tools:

- **🎥 Async Live Code Reviews:** Record video walkthroughs as you review code, explaining your logic and decisions in real-time.
- **👥 Teams & Presence Sharing:** Create teams, invite members, and see who is viewing a review with real-time presence indicators and live cursors.
- **💬 Video Commenting:** Replace text threads with timestamped video responses linked to specific code lines.
- **🛠️ Modern Code Review Workspace:** A VS Code-like environment with syntax highlighting, unified/split diff views, and file tree navigation.
- **🤖 AI Analysis & Explain:** Gemini AI provides instant code explanations, detects code smells, and suggests improvements.
- **✅ Smart Checklists:** AI-powered checklists verify common requirements automatically.
- **🔗 GitHub Integration:** Import repositories and pull requests directly from GitHub without leaving the app.
- **📤 Flexible & P2P Sharing:** Share reviews via link, or transfer large files directly between devices (P2P) without cloud upload limits.
- **📍 Smart Chapters:** Automatically detects when you switch files during recording and creates navigable chapters.
- **📝 Rich Commenting:** Support for Markdown, mentions, and threaded discussions.

Think of it as “Loom meets GitHub”—optimized for code review.

---

## How We Built It

**Tech Stack:**

- **Frontend:** SvelteKit (Svelte 5 runes), TailwindCSS, shadcn-svelte components
- **Local-First Sync:** sveltekit-sync, IndexedDB
- **Desktop/Mobile:** Tauri 2.x for native cross-platform apps (Native Mobile Feel)
- **Database:** PostgreSQL + Drizzle ORM
- **Authentication:** Better-Auth (email, Google, GitHub)
- **AI:** Gemini 2.0 Flash (Google) for code analysis
- **Payments:** Dual Payments (Stripe (global) & Paystack (Africa))
- **Video:** MediaRecorder API with ffmpeg.wasm for compression
- **Storage:** Cloudflare R2 for video files

**Architecture Highlights:**

- Optimistic UI updates (instant feedback, background sync)
- Hybrid storage (IndexedDB for small files, cloud for large)
- Row-level security (users only see their data)
- Delta sync (only changed records, efficient updates)
- Class-based Svelte stores with reactive getters

**Key Features:**

- Full authentication & onboarding flows
- Video recording and playback with markers
- Code editor with syntax highlighting and unified/split diff views
- AI-powered code explain/suggest/summarize/smell detection
- Team management, roles/permissions, subscription tiers
- Mobile and desktop-optimized settings & flows
- Global Cmd+K search, keyboard shortcuts, notifications
- Flexible import/export (GitHub/GitLab PRs, .crl files, P2P sharing)
- Accessibility: WCAG AA compliance, keyboard/screen reader support
- Production-grade UI (70+ components, responsive design)
- Type-safe everywhere (TypeScript, Valibot validation)

---

## Local Development Setup

### Prerequisites

- Node.js (>=18)
- pnpm or npm
- PostgreSQL
- Rust & Cargo (for Tauri desktop app)

### Quick Start

1. **Clone the repository**  
   ```sh
   git clone https://github.com/mudiageo/codereview-live.git
   cd codereview-live
   ```

2. **Install dependencies**  
   ```sh
   pnpm install
   # or
   npm install
   ```

3. **Set up environment variables**  
   - Copy `.env.example` to `.env`
   - Fill in keys for database, auth, payments, OAuth, SMTP, and AI (see sample below):

     ```env
     DATABASE_URL=postgres://user:pass@host:port/dbname
     AUTH_SECRET=
     AUTH_URL=
     STRIPE_SECRET_KEY=
     PAYSTACK_SECRET_KEY=
     GITHUB_CLIENT_ID=
     ...
     ```

4. **Initialize the database**  
   ```sh
   pnpm run db:push
   pnpm run db:migrate
   ```

5. **Start the local dev server**  
   ```sh
   pnpm run dev
   # open http://localhost:3232
   ```

6. **(Optional) Build desktop app (requires Rust/Tauri CLI)**  
   ```sh
   pnpm run tauri
   ```

7. **Run tests and lint**  
   ```sh
   pnpm run test
   pnpm run lint
   pnpm run format
   ```

---

## Challenges We Ran Into

- **The Sync Challenge (Solved with `sveltekit-sync`):**
  Building a local-first app that syncs seamlessly across devices was our biggest hurdle. Existing solutions were either too heavy or didn't fit SvelteKit's architecture. We solved this by building **`sveltekit-sync`**, a custom library that handles offline storage (IndexedDB), conflict resolution (CRDT-inspired last-write-wins), and efficient delta updates. This allows users to work offline and sync instantly when back online.

- **Real-Time Presence & Cursors:**
  Implementing live cursors and presence indicators without overloading the server required careful optimization. We used ephemeral state in our sync engine to broadcast position updates efficiently, ensuring smooth collaboration without persistent database writes.

- **High-Fidelity Video Recording:**
  Capturing high-quality code walkthroughs in the browser while maintaining performance was tricky. We utilized `ffmpeg.wasm` for client-side compression to ensure videos upload quickly and playback smoothly, even on slower connections.

- **Native Mobile Support:**
  Getting the app to feel "native" on mobile while sharing a codebase with the web version was challenging. We had to carefully manage touch events, viewport scaling, and navigation gestures to ensure a smooth experience on iOS and Android devices via Tauri.

- **Real-Time Data Consistency:**
  Balancing local-first optimistic updates with real-time server state (for presence and cursors) required complex conflict resolution strategies to ensure users never saw stale data or overwrote each other's work blindly.

---

## Accomplishments

- MVP built in 5 weeks, 50+ routes/components
- True offline-first UX, native everywhere (desktop/web/mobile)
- Polished, production-quality UI (70+ shadcn-svelte components)
- Gemini-powered AI insights for developers
- Developer-centric: VS Code themes, keyboard shortcuts, global search
- Accessible (WCAG AA), type-safe, scalable
- Covers authentication, payments, team collab, AI, and more

---

## What We Learned

- Svelte 5 runes and class stores create clean, maintainable state
- Local-first UIs make latency invisible
- Guardrails needed for AI features
- Client-side video compression saves massive bandwidth
- Documentation-first and component libraries accelerate development
- Pricing and onboarding require deep iteration

---

## What’s Next for CodeReview.live

- 🎥 Improved video recorder (window selection, annotations)
- 🔗 PR import/comment sync for GitHub/GitLab
- 📧 Email notifications (SMTP)
- 📱 iOS/Android apps (via Tauri)
- 🤝 Live collaboration, presence indicators
- 🔌 VS Code/JetBrains extensions
- 📊 Team analytics
- 🌐 Internationalization
- 🎯 Advanced AI code analysis
- 🏢 Enterprise features (SSO, audit logs)

**Long-term:**  
To become the standard for async code reviews—replacing PR text comments with clear video communication, searchable knowledge, AI-powered suggestions, and seamless onboarding.

---

## Try It!

- Live Demo: [codereview.live](https://codereview.live)
- Repo: [github.com/mudiageo/codereview-live](https://github.com/mudiageo/codereview-live)

**Built for CodeSpring Hackathon 2025 | SvelteKit · Tauri · Gemini AI · Better-Auth · Drizzle ORM**

---
