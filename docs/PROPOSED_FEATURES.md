# Proposed Features and Improvements

This document outlines potential new features, improvements to existing functionalities, and enhancements to user workflows for CodeReview.live.

## 1. Team Management Enhancements

### Granular Permissions
*   **Current State:** Basic roles (Owner, Admin, Member, Viewer).
*   **Proposal:** Implement custom role definitions allowing fine-grained control over project creation, repo syncing, and deletion rights.
*   **Workflow Improvement:** Administrators can confidently invite external contractors with restricted access to specific projects only.

### Organization Hierarchy
*   **Current State:** Single-level team structure.
*   **Proposal:** Support for nested teams or departments (e.g., Engineering > Frontend > Core UI).
*   **Workflow Improvement:** Large organizations can map their actual structure to the platform, simplifying user management.

## 2. Mobile Experience Improvements

### Gesture-Based Navigation
*   **Current State:** Tap-based navigation.
*   **Proposal:** Implement swipe gestures for:
    *   Switching between files (Swipe Left/Right).
    *   Marking files as viewed (Swipe Down).
    *   Closing the comment drawer (Swipe Down).
*   **Workflow Improvement:** Faster review triage on mobile devices.

### Offline Mode
*   **Current State:** Requires active internet connection.
*   **Proposal:** Allow downloading reviews for offline viewing. Sync comments and approvals when back online.
*   **Workflow Improvement:** enabling reviews during commutes or travel.

### Mobile Video Recorder Enhancements
*   **Current State:** Basic recording.
*   **Proposal:** Add drawing tools overlay during mobile recording, allowing users to highlight code lines while recording on touch screens.

## 3. AI & Automation

### Automated Initial Review
*   **Current State:** On-demand AI analysis.
*   **Proposal:** Trigger AI analysis automatically on PR creation via webhook, posting a summary comment before a human reviewer sees it.
*   **Workflow Improvement:** Reduces time spent on trivial issues; reviewers focus on architectural decisions.

### Voice-to-Text Comments
*   **Current State:** Text or Video.
*   **Proposal:** Auto-transcribe video comments into text for searchability and quick reading.
*   **Workflow Improvement:** Accessibility and ease of reference without watching the full video.

## 4. Onboarding & Gamification

### Interactive Walkthroughs
*   **Current State:** Static lessons/videos.
*   **Proposal:** Interactive overlay tours that guide users through their first actual review.
*   **Workflow Improvement:** "Learning by doing" reduces time-to-value for new users.

### Skill Badges
*   **Proposal:** Award badges for milestones (e.g., "Bug Hunter" for finding bugs, "Quick Responder" for fast reviews).
*   **Workflow Improvement:** Encourages healthy review habits and team engagement.

## 5. IDE Integrations

### VS Code Extension
*   **Proposal:** A dedicated extension to view video comments directly within the IDE editor gutter.
*   **Workflow Improvement:** Developers don't need to context switch between the browser and their code editor.
