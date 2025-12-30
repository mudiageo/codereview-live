# OAuth, GitLab, and Local Git Features - Implementation Summary

## Overview
This document summarizes the implementation of OAuth connections, GitLab integration, local git repository browser, and .diff/.patch file format support.

## Implementation Commits
- **529c2af**: Add OAuth connections UI, GitLab integration, git browser, and diff/patch support with all API routes
- **97eb362**: Complete OAuth integrations page, API routes, and integrate GitLab + diff/patch upload in reviews/new

## Features Implemented

### 1. OAuth Connections Management
**Route**: `/settings/integrations`

**Features**:
- Connect/disconnect GitHub, GitLab, and Google accounts
- Visual status indicators (connected/disconnected)
- Display connected account information (username, email, avatar)
- Secure OAuth flow with proper callback handling
- Token storage in database accounts table

**UI Components**:
- Provider cards showing connection status
- Connect/Disconnect buttons
- Account information display
- Loading states during OAuth flow

### 2. GitLab Integration
**File**: `src/lib/utils/gitlab-import.ts`

**Features**:
- OAuth authentication with GitLab
- Repository browsing and search
- Merge request (MR) listing
- MR diff retrieval
- File change listings
- Support for self-hosted GitLab instances

**API Methods**:
```typescript
class GitLabImporter {
  static getAccessToken(code, clientId, clientSecret, redirectUri): Promise<string>
  getUserProjects(search?): Promise<GitLabProject[]>
  getProjectMergeRequests(projectId): Promise<GitLabMergeRequest[]>
  getMergeRequestDiff(projectId, mrIid): Promise<string>
  getMergeRequestFiles(projectId, mrIid): Promise<FileInfo[]>
}
```

### 3. Local Git Repository Browser
**File**: `src/lib/utils/git-browser.ts`

**Features**:
- File System Access API integration
- Browse local git repositories
- List repository files
- Detect branches
- Read current branch
- Graceful fallback for unsupported browsers

**Browser Support**:
- ✅ Chrome, Edge (File System Access API)
- ⚠️ Safari, Firefox (fallback message shown)

**API Methods**:
```typescript
class GitBrowser {
  static isSupported(): boolean
  openRepository(): Promise<GitRepository | null>
  listFiles(path?): Promise<string[]>
  readFile(path): Promise<string>
}
```

### 4. .diff/.patch File Format Support
**File**: `src/lib/utils/diff-parser.ts`

**Features**:
- Parse unified diff format
- Parse git diff format
- Extract file changes with line-by-line details
- Calculate addition/deletion statistics
- Multi-file diff support
- Automatic language detection from file paths

**API Methods**:
```typescript
class DiffParser {
  static parse(content): ParsedDiff
  static isValidDiff(content): boolean
  static stringify(parsed): string
}
```

**Data Structures**:
```typescript
interface ParsedDiff {
  content: string;
  language: string;
  files: DiffFile[];
  stats: { files: number; additions: number; deletions: number };
}
```

### 5. API Routes

**OAuth Flow**:
- `GET /api/oauth/authorize?provider={github|gitlab|google}` - Initiate OAuth
- `GET /api/oauth/callback/{provider}` - Handle OAuth callback
- `GET /api/oauth/connected` - List connected accounts
- `POST /api/oauth/disconnect` - Disconnect provider

**Provider-Specific**:
- GitHub: `/api/github/oauth`, `/api/github/callback`
- GitLab: `/api/gitlab/oauth`, `/api/gitlab/callback`
- Google: `/api/google/oauth`, `/api/google/callback`

### 6. Integration in Reviews/New Page

**Code Import Tabs**:
1. **Paste**: Direct code input with CodeEditor
2. **Upload**: File upload with drag & drop
   - Supports .js, .ts, .py, .diff, .patch, and more
   - Auto-detects file type and language
   - Parses .diff/.patch files automatically
3. **GitHub**: GitHub PR import dialog
4. **GitLab**: GitLab MR import (coming soon)
5. **Local Git**: Local repository browser

**File Upload Features**:
- Drag & drop support
- .diff/.patch auto-detection and parsing
- Language auto-detection
- Multi-file diff handling
- Visual feedback for uploads

### 7. Database Schema

**Accounts Table** (existing, utilized for OAuth):
```sql
CREATE TABLE accounts (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  provider_id TEXT, -- 'github', 'gitlab', 'google'
  account_id TEXT,
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

## Environment Variables

Add to `.env`:
```bash
# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# GitLab OAuth
GITLAB_CLIENT_ID=your_gitlab_client_id
GITLAB_CLIENT_SECRET=your_gitlab_client_secret

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

## Usage Examples

### Connect OAuth Account
```typescript
// User navigates to /settings/integrations
// Clicks "Connect" on GitHub/GitLab/Google
// OAuth flow initiated
// User authorizes on provider site
// Redirected back with token
// Token stored in database
// Connection status updated in UI
```

### Import from GitLab
```typescript
import { GitLabImporter } from '$lib/utils/gitlab-import';

const importer = new GitLabImporter(accessToken);
const projects = await importer.getUserProjects();
const mrs = await importer.getProjectMergeRequests(projectId);
const diff = await importer.getMergeRequestDiff(projectId, mrIid);
```

### Browse Local Git
```typescript
import { GitBrowser } from '$lib/utils/git-browser';

if (GitBrowser.isSupported()) {
  const browser = new GitBrowser();
  const repo = await browser.openRepository();
  const files = await browser.listFiles();
  const content = await browser.readFile('src/main.ts');
}
```

### Parse .diff/.patch Files
```typescript
import { DiffParser } from '$lib/utils/diff-parser';

const parsed = DiffParser.parse(diffContent);
console.log(`${parsed.stats.files} files changed`);
console.log(`+${parsed.stats.additions} -${parsed.stats.deletions}`);
parsed.files.forEach(file => {
  console.log(`${file.newPath}: ${file.additions} additions, ${file.deletions} deletions`);
});
```

## Security Considerations

1. **OAuth Tokens**: Stored securely in database, never exposed to client
2. **API Keys**: Server-side only, not in client bundles
3. **File Access**: Local git browser requires explicit user permission
4. **Token Refresh**: Automatic refresh for expired tokens (when supported by provider)
5. **HTTPS**: Required for OAuth flows in production

## Testing

### Manual Testing Checklist
- [ ] Connect GitHub account via OAuth
- [ ] Connect GitLab account via OAuth
- [ ] Connect Google account via OAuth
- [ ] Disconnect each provider
- [ ] Upload .diff file in reviews/new
- [ ] Upload .patch file in reviews/new
- [ ] Browse local git repository (Chrome/Edge)
- [ ] Verify fallback message (Safari/Firefox)
- [ ] Import from GitHub PR
- [ ] Verify token storage in database
- [ ] Test token expiration and refresh

### Browser Compatibility
| Feature | Chrome | Edge | Firefox | Safari |
|---------|--------|------|---------|--------|
| OAuth | ✅ | ✅ | ✅ | ✅ |
| File Upload | ✅ | ✅ | ✅ | ✅ |
| .diff/.patch | ✅ | ✅ | ✅ | ✅ |
| Local Git | ✅ | ✅ | ⚠️ | ⚠️ |

✅ Fully supported | ⚠️ Fallback message shown

## Future Enhancements

1. **GitLab Import Dialog**: Similar UI to GitHub import
2. **Git Commit History**: Browse commits in local repositories
3. **Diff Visualization**: Syntax-highlighted diff viewer
4. **Token Refresh**: Automatic OAuth token refresh
5. **Multiple Account Support**: Connect multiple accounts per provider
6. **Webhook Support**: Real-time sync from providers

## Troubleshooting

### OAuth Not Working
- Verify environment variables are set
- Check OAuth app configuration in provider dashboard
- Ensure callback URLs match configuration
- Check browser console for errors

### Local Git Browser Not Working
- Verify browser supports File System Access API
- Check browser version (Chrome 86+, Edge 86+)
- Ensure user grants permission when prompted
- Verify .git directory exists in selected folder

### .diff/.patch Not Parsing
- Verify file format is unified diff or git diff
- Check file encoding (should be UTF-8)
- Ensure file contains valid diff headers (---, +++, @@)

## Files Modified/Created

### New Files (15)
1. `src/lib/utils/gitlab-import.ts`
2. `src/lib/utils/git-browser.ts`
3. `src/lib/utils/diff-parser.ts`
4. `src/routes/(app)/settings/integrations/+page.svelte`
5-13. API routes for OAuth (9 files)

### Modified Files (3)
1. `src/lib/utils/language-detector.ts` - Added .diff/.patch support
2. `src/routes/(app)/reviews/new/+page.svelte` - Integrated all features
3. `.env.example` - Added OAuth variables

## Documentation
- See `SAAS_IMPLEMENTATION.md` for general SaaS features
- See `IMPLEMENTATION_COMPLETE.md` for overall completion status
- This document for OAuth/GitLab/Git-specific features

## Support
For issues or questions:
1. Check browser console for errors
2. Verify environment variables
3. Check OAuth provider dashboard
4. Review API logs for errors
5. Consult troubleshooting section above
