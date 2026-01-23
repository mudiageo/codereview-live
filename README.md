# CodeReview.live – Async Video Code Reviews

## Inspiration

We've all been there: hours spent on code review, dozens of text comments—and still, confusion lingers. Text alone lacks context, emotion, and clarity.
**CodeReview.live** was born from the insight that a 2-minute video can replace 20 minutes of typing, making code review more human and effective. Inspired by CodeSpring’s “renewal” theme, we’re transforming developer communication from frustrating text exchanges to clear, async video conversations.

---

## What It Does

**CodeReview.live** transforms code reviews into async video walkthroughs:

- **🎥 Record & Explain:** Create video walkthroughs as you review code, explaining your logic and decisions.
- **💬 Video Responses:** Reviewers can respond with timestamped video comments linked to specific code lines.
- **🤖 AI-Powered Insights:** Gemini AI provides code explanations, suggestions, and detects code smells.
- **🔄 Works Everywhere:** Local-first, works offline and syncs when online—web, desktop, and mobile.
- **👥 Team Collaboration:** Real-time updates, threaded conversations, and team management.
- **📤 Flexible Sharing:** Share via link, export as file, or peer-to-peer transfer.
- **Syntax Highlighting & Diff Views:** Purpose-built for code review with powerful visualizations.

Think of it as “Loom meets GitHub”—optimized for code review.

---

## How We Built It

**Tech Stack:**

- **Frontend:** SvelteKit (Svelte 5 runes), TailwindCSS, shadcn-svelte components
- **Local-First Sync:** sveltekit-sync, IndexedDB
- **Desktop/Mobile:** Tauri 2.x for native cross-platform apps
- **Database:** PostgreSQL + Drizzle ORM
- **Authentication:** Better-Auth (email, Google, GitHub)
- **AI:** Gemini 2.0 Flash (Google) for code analysis
- **Payments:** Stripe (global) & Paystack (Africa)
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

- **Video Recording in Browser:** Solved MediaRecorder API limitations using Tauri desktop features and web fallbacks.
- **Offline-First Sync:** Built robust conflict resolution with “last-write-wins” and a reliable sync queue.
- **Video Storage & Compression:** Client-side ffmpeg.wasm reduces file size by 60-70%, hybrid local/cloud storage for performance.
- **Svelte 5 Migration:** Adopted runes and class-based stores for state management.
- **Native Mobile Feel:** Optimized touch targets, bottom navs, swipe gestures, and safe areas.
- **Dual Payments:** Integrated Stripe and Paystack, handling different webhooks and syncing subscription states.

---

## Accomplishments

- MVP built in 3 weeks, 50+ routes/components
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