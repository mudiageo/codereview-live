# CodeReview.live — Master Roadmap

> **Vision:** All-in-one platform for async video code reviews — SaaS tool, developer education platform, startup team accelerator, and enterprise-ready product.
> **Design Direction:** Dark-first glassmorphism with neon purple/blue accents (modern SaaS)

---

## 🗺️ PRODUCT TIERS

| Tier | Target | Key Unlocks |
|---|---|---|
| **Free** | Solo devs, open source | 5 reviews/mo, 1 project, basic AI, guest links |
| **Pro** | Individual professionals | Unlimited reviews, all AI features, video transcripts, custom templates |
| **Team** | Startup & indie teams | Approval workflows, SLA tracking, Slack/webhooks, leaderboard, analytics |
| **Enterprise** | Companies | SSO, audit logs, SAST, BYOM, compliance, dedicated support, API |

---

## 🔍 PHASE 0 — Fix Genuine Gaps (Immediate)

*Things that are broken or missing from existing features*

- [ ] **Team page member list** — wire up real member data, roles, avatars
- [ ] **Review approval workflow** — Approve / Request Changes / Comment status system (replaces draft/published)
- [ ] **Review assignments** — assign one or more reviewers to a review
- [ ] **Review deadlines / SLA** — due dates, overdue indicators, reminder notifications
- [ ] **Review templates** — pre-built checklists per project type (frontend, backend, security, API, infra)
- [ ] **Bulk actions on reviews list** — multi-select, bulk assign, bulk archive, bulk delete
- [ ] **Project changelog** — release notes section per project
- [ ] **"Needs your review" inbox** — personal inbox showing only assigned reviews sorted by urgency
- [ ] **Code diff commenting from reviews list** — inline comment without opening the full review
- [ ] **Review scheduling** — schedule a review for future delivery/deadline, not just SLA tracking
- [ ] **Review search page** — dedicated `/search` page (beyond command palette) with filters by date, reviewer, status, AI score, project

---

## 🎨 PHASE 1 — UI/UX Full Overhaul

### Design System
- [ ] Dark-first color palette: `#0a0a0f` base, neon purple + electric blue accents
- [ ] Glass surfaces: `rgba(255,255,255,0.04)` + `backdrop-blur(16px)`
- [ ] Animated gradient borders on feature cards and CTAs
- [ ] Updated `layout.css` and `animations.css`
- [ ] Illustrated empty states with brand characters/graphics

### New UI Components
- [ ] `animated-gradient-border.svelte`
- [ ] `number-counter.svelte` (animated stat counters)
- [ ] `marquee.svelte` (scrolling logo/text strip)
- [ ] `testimonial-carousel.svelte`
- [ ] `activity-feed.svelte`
- [ ] `stat-sparkline-card.svelte`
- [ ] `approval-workflow.svelte`
- [ ] `reviewer-assignment.svelte`
- [ ] `sla-tracker.svelte`
- [ ] `tech-debt-tracker.svelte`
- [ ] `video-highlight-reel.svelte`
- [ ] `review-knowledge-base-search.svelte`
- [ ] `whats-new-modal.svelte`

### Marketing Pages
- [ ] **Landing page** — animated mesh hero, typing effect headline, marquee "trusted by devs at...", interactive feature tabs (Video / AI / Teams), testimonials carousel (6 quotes auto-scroll), animated stats counters, FAQ accordion, gradient CTA banner
- [ ] **Pricing page** — annual/monthly toggle with savings highlight, 4-tier cards, comparison table, gradient borders on recommended plan
- [ ] **Features page** — interactive demo per feature category
- [ ] **About page** — team, story, mission, tech stack showcase
- [ ] **Marketing layout** — glassmorphism navbar with dark mode toggle, dark footer with newsletter signup, social links

### Auth Pages
- [ ] **Login** — split layout (animated brand panel left / glass form right), gradient logo
- [ ] **Signup** — same + password strength meter, plan selection at signup
- [ ] **Forgot password / Reset** — consistent glassmorphism redesign
- [ ] **Verify email** — branded confirmation screen

### App Interior
- [ ] **App layout** — sidebar with gradient active state, breadcrumbs, theme toggle in header, "What's New" badge
- [ ] **Dashboard** — time-aware welcome banner ("Good morning, Alex"), sparkline stat cards with animated counters, activity feed sidebar, onboarding progress stepper for new users, team online status strip
- [ ] **Reviews list** — bulk actions toolbar, kanban/grid/list view toggle, SLA urgency color indicators, review request badges
- [ ] **Review detail** — improved layout, approval bar at top, assignee panel, SLA countdown
- [ ] **Team page** — member list wired up, leaderboard tab, badges gallery, code ownership heatmap
- [ ] **Notifications page** — filter by type, mark all read, per-type preferences, digest preview
- [ ] **Analytics page** — polish existing charts, add velocity dashboard, code health score widget
- [ ] **Settings** — full visual redesign to match new design system

### New App Pages
- [ ] `(app)/inbox` — personal "Needs Your Review" inbox
- [ ] `(app)/search` — full-text search page with filters
- [ ] `(app)/integrations` — Slack, Discord, webhooks, Linear, Jira, GitHub Action setup UI
- [ ] `(app)/changelog` — "What's New" release history page

---

## 🤖 PHASE 2 — AI & Agentic Features

### Inline AI
- [ ] **AI auto-reviewer bot** — on review publish, AI posts inline comments as `@CodeReview AI` with severity: 🔴 critical / 🟡 warning / 🔵 suggestion
- [ ] **AI fix suggestions** — each finding has one-click "Apply Fix" generating a code patch
- [ ] **Ask AI about this line** — right-click any diff line → floating chat with full code context
- [ ] **AI PR description generator** — auto-write PR description from diff in one click
- [ ] **AI-powered comment improvement** — suggest better wording for a comment before posting
- [ ] **AI severity scoring** — each bug/smell finding color-coded with severity score

### Agentic AI
- [ ] **Agentic code fixer** — AI opens a "fix session", applies changes across multiple files, proposes full patch bundle for one-click accept
- [ ] **Smart review routing** — AI reads diff, recommends best reviewer based on past history and expertise
- [ ] **AI architecture diagram generator** — from a diff, draw component/dependency diagram of what changed
- [ ] **AI review coach** — for junior devs, annotates what makes each comment good/bad, suggests better phrasing
- [ ] **AI-generated weekly digest** — auto-summary of what team reviewed, top issues found, trends
- [ ] **Recurring code smell report** — scheduled AI scan across all projects, emailed/notified weekly

### Model Flexibility
- [ ] **Bring Your Own Model (BYOM)** — plug in local Ollama, custom OpenAI endpoint, or Anthropic key
- [ ] **Model selector per review** — choose which AI model to use for specific analysis
- [ ] **MCP server** — expose CodeReview.live reviews/diffs as context to AI coding assistants (Cursor, Claude, Copilot, GitHub Copilot)

---

## 📹 PHASE 3 — Video-First Enhancements

*CodeReview.live's unique edge — go deeper on video*

### Recording Improvements
- [ ] **Window / application selection** — choose a specific app window to record, not just full screen (mentioned in README "What's Next")
- [ ] **Multi-camera support** — face cam + screen + second monitor simultaneously
- [ ] **Noise cancellation + virtual background** — for webcam bubble during recording
- [ ] **Improved video annotations during recording** — draw arrows, highlight areas on screen while recording
- [ ] **Countdown timer customization** — already exists, improve the UX
- [ ] **P2P sharing improvements** — better progress indicators, retry logic, larger file support

### Playback & Discovery
- [ ] **Video transcript search** — search spoken words inside any video review, jump to exact timestamp
- [ ] **Auto-generated smart chapter titles** — AI names chapters from what's being discussed, not just file names
- [ ] **Video highlight reel** — auto-cut "key moments" from long review into a 2-min summary clip
- [ ] **Video speed memory** — remember each user's preferred playback speed per review
- [ ] **Video reactions overlay** — emoji reactions that float on the video at specific timestamps
- [ ] **Inline video timestamp comments** — click any comment → video jumps to that exact moment (seamless improvement)
- [ ] **Video bookmarks** — personal bookmarks at specific timestamps

### Collaboration on Video
- [ ] **Collaborative video annotation** — draw/annotate ON the video frame while watching (Figma-style)
- [ ] **Voice comment mode** — record a quick voice note instead of typing (auto-transcribed)
- [ ] **Virtual presenter mode** — AI avatar reads out review summary if no video was recorded

### Sharing
- [ ] **Review embed widget** — embed read-only review player on any external webpage
- [ ] **Public shareable review page** — clean, minimal, no-login view for clients/stakeholders

---

## 🔗 PHASE 4 — Integrations & Platform

### Communication
- [ ] **Slack integration** — post to channel on review publish, approval, comment, SLA breach
- [ ] **Discord integration** — same as Slack
- [ ] **Email digest** — daily/weekly digest of pending reviews and activity (infra already exists, wire up UI)
- [ ] **Microsoft Teams integration** — for enterprise teams

### Project Management
- [ ] **Linear ticket linking** — attach a review to a Linear issue, sync status
- [ ] **Jira ticket linking** — attach a review to a Jira issue, sync status
- [ ] **Review-linked sprints / milestones** — group reviews by sprint or milestone
- [ ] **GitLab MR import** — alongside existing GitHub PR import
- [ ] **Notion integration** — push review summaries to Notion pages

### Developer Platform
- [ ] **Public REST API** — full CRUD for reviews, projects, comments; API key management UI
- [ ] **Webhook support** — fire events to any endpoint (PR approved → trigger CI deploy)
- [ ] **GitHub Action** — auto-create a CodeReview.live draft when a PR is opened
- [ ] **CLI tool** (`crl create`, `crl review`, `crl publish`) — create/manage reviews from terminal
- [ ] **Browser extension** — "Review on CodeReview.live" button on GitHub/GitLab PR pages
- [ ] **VS Code extension** — view and comment on reviews without leaving editor
- [ ] **JetBrains extension (IntelliJ / WebStorm / PyCharm)** — same as VS Code, for JetBrains IDEs

---

## 🛡️ PHASE 5 — Security & Enterprise

### Security Scanning
- [ ] **Secret detection** — scan diffs for committed API keys, passwords, tokens before publish; block or warn
- [ ] **Dependency vulnerability scan** — flag known CVEs in `package.json`, `Cargo.toml`, `requirements.txt`
- [ ] **License compliance checker** — flag incompatible licenses from new dependencies
- [ ] **SAST integration** — connect Semgrep or CodeQL, show findings inline in diff viewer
- [ ] **Security-focused review template** — pre-built OWASP-aligned checklist

### Enterprise Features
- [ ] **SSO (SAML/OIDC)** — enterprise identity provider login (Okta, Auth0, Azure AD)
- [ ] **SOC2 / compliance audit log** — exportable log of all review activity with timestamps
- [ ] **Row-level security per org** — already partially built, harden and expose controls
- [ ] **Advanced role management** — custom roles beyond owner/admin/member
- [ ] **Data residency options** — choose storage region (EU, US, APAC)
- [ ] **Dedicated onboarding** — enterprise onboarding with team import from GitHub org / Google Workspace
- [ ] **SLA enforcement at org level** — org-wide review turnaround time policies

---

## 👥 PHASE 6 — Social, Community & Education

### Developer Education
- [ ] **Mentorship mode** — senior marks comments as "teaching moments", junior sees a structured learning path
- [ ] **AI review coach** — real-time feedback on comment quality while typing
- [ ] **Review quality scoring** — rate helpfulness/quality of a review; build reviewer reputation over time
- [ ] **Best practices feed** — curated tips surfaced from AI analysis of the best reviews on the platform
- [ ] **Code review workshops** — schedule live review sessions with screen share + video for teams or courses
- [ ] **Review bounties** — post a bounty for community members to review your code (monetization + community)
- [ ] **Learning paths** — structured sequences of great public reviews to study by language or domain

### Community & Social
- [ ] **Public reviewer profile** — shareable portfolio: review activity, languages, expertise tags, badge showcase
- [ ] **Review templates marketplace** — share/download community-made checklists and workflow templates
- [ ] **Peer review scoring** — community rates review quality, builds reputation system with leaderboard
- [ ] **Reviewer badges & streaks** — First Review, 30-day streak, Power Reviewer, Security Champion, AI Whisperer
- [ ] **Team leaderboard** — most reviews completed, fastest turnaround, highest AI score, code health impact
- [ ] **"Review of the Week"** — spotlight exceptional reviews in-app and via newsletter
- [ ] **Review knowledge base** — searchable archive of all past reviews and AI insights per project, per team

### Guest & External Collaboration
- [ ] **Guest reviewer magic link** — invite anyone to comment on one review without creating an account
- [ ] **Client review portal** — clean branded portal for sharing reviews with non-technical stakeholders
- [ ] **Improved real-time co-review UX** — two people viewing same review with live cursors, presence, and voice (builds on existing presence layer)

---

## 📱 PHASE 7 — Mobile & Native (Tauri)

- [ ] **Mobile review reader** — optimized phone view for consuming (not just recording) reviews
- [ ] **Haptic feedback** — on reactions, approvals, and key actions on mobile
- [ ] **Offline review drafts** — write comments offline, auto-sync on reconnect (local-first already exists)
- [ ] **Native push notifications** — via Tauri for assignments, approvals, SLA alerts, mentions
- [ ] **iOS / Android app store submission** — via Tauri mobile build
- [ ] **Mobile recording optimization** — smoother webcam + screen capture flow on mobile

---

## 📊 PHASE 8 — Advanced Analytics & Insights

- [ ] **Code ownership map** — who owns which files based on review history and comment patterns
- [ ] **Review velocity dashboard** — team review turnaround speed over time, per reviewer
- [ ] **Team code health score** — aggregate AI-based quality metric per project over time
- [ ] **Tech debt tracker** — AI tracks recurring issues across reviews, shows trend graph
- [ ] **Review ROI calculator** — hours saved vs. traditional text-only code review, shareable report
- [ ] **Automated release notes** — AI compiles all reviews since last release into a structured changelog
- [ ] **Sprint / release review reports** — exportable PDF/Markdown summary per sprint or release
- [ ] **Heatmap calendar** — review activity by day/week/month (GitHub-style contribution graph)
- [ ] **Reviewer impact score** — measure how much a reviewer's comments led to code improvements

---

## 🔬 PHASE 9 — Diff Viewer & Code Intelligence

*Improving the core code review workspace — the heart of the product*

- [ ] **Blame view in diff** — see who last changed each line alongside the diff
- [ ] **File history view** — see all past reviews that touched a specific file
- [ ] **Code navigation in diff** — "Go to definition", "Find references" within the diff viewer
- [ ] **Stacked PRs support** — review a chain of dependent PRs with visual dependency graph
- [ ] **Branch comparison** — compare any two branches directly, not just PR diffs
- [ ] **Commit history timeline** — visual timeline of commits included in a review
- [ ] **Side-by-side vs unified diff toggle** — already exists, improve the UX and add minimap
- [ ] **Syntax-aware diff** — show diffs at the AST/semantic level, not just line-by-line

---

## ⚡ QUICK WINS (do anytime — low effort, high impact)

- [ ] Review reactions: 👍 👎 ❓ 🎉 💡 on comments (no full reply needed)
- [ ] Dark/light mode toggle in marketing navbar and app sidebar
- [ ] Animated number counters on landing page stats (1000+ reviews, etc.)
- [ ] Scrolling marquee "trusted by devs at..." strip on landing
- [ ] FAQ accordion on landing + pricing pages
- [ ] Keyboard shortcut to toggle theme (`Cmd+Shift+L`)
- [ ] Copy review link button on every review card
- [ ] "What's New" changelog modal on first login after update
- [ ] Illustrated empty states on all pages (reviews, projects, team, inbox)
- [ ] Onboarding checklist widget on dashboard for new users
- [ ] Internationalization (i18n) foundation — English first, structure for future languages
- [ ] "Share on Twitter/X" button for public reviews
- [ ] Review card hover preview — show first few lines of diff on hover
- [ ] Keyboard shortcut panel improvements — add recent items section, quick create actions
- [ ] Improved P2P share dialog UX — progress bar, speed indicator, retry button

---

## 📌 IMPLEMENTATION PRIORITY ORDER

```
Phase 0  →  Fix gaps (team page, approval, assignments, SLA, search page)
Phase 1  →  Full UI/UX overhaul (parallel to Phase 0)
Phase 2  →  AI auto-reviewer + fix suggestions + agentic + BYOM + MCP
Phase 3  →  Video enhancements (transcripts, highlights, annotations, recording)
Phase 4  →  Integrations (Slack, Discord, webhooks, CLI, API, browser ext, VS Code, JetBrains)
Phase 5  →  Security + Enterprise (secret detection, SAST, SSO, audit log)
Phase 6  →  Community + Education (mentorship, profiles, marketplace, bounties, co-review)
Phase 7  →  Mobile/Native (push notifications, mobile reader, app store)
Phase 8  →  Advanced analytics (ownership map, health score, ROI, heatmap)
Phase 9  →  Diff viewer & code intelligence (blame, navigation, stacked PRs, semantic diff)
Quick Wins → Sprinkled throughout all phases
```

---

*Last updated: 2026-09-14 | Status: Planning → Ready to build*
*~110 features across 9 phases + quick wins | Tiers: Free / Pro / Team / Enterprise*
