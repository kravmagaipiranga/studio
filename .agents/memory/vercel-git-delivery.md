---
name: Vercel/Git delivery
description: Distinguish local commits, GitHub remote state, and Vercel deployment status.
---

Treat workspace Git status, shell push output, the remote branch, and Vercel deployment state as separate facts. In this workspace, `git push` returned an authentication error, but `git ls-remote origin refs/heads/main` later confirmed the commit on the remote branch. The Vercel integration also reported as added while its API rejected the token.

**Why:** During a missing-deploy investigation, local and remote Git state differed, and the Vercel API was inaccessible because its credential was invalid.

**How to apply:** Check the remote branch directly before retrying pushes. Check Vercel deployment events only after its API credential is valid; do not equate a local commit or an “added” connection status with a completed deployment.
