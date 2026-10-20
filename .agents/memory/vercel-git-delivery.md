---
name: Vercel/Git delivery
description: Distinguish local commits, GitHub remote state, and Vercel deployment status.
---

Treat workspace Git status, shell push output, the remote branch, and Vercel deployment state as separate facts. In this workspace, the npm registry is configured to use Replit's private package firewall; lockfiles generated there can store internal tarball URLs that external builders such as Vercel cannot resolve. Use canonical `https://registry.npmjs.org/` URLs in committed lockfiles while preserving versions and integrity hashes; npm's `replace-registry-host=npmjs` setting still routes local installs through the configured mirror.

If `git push` fails authentication while `gh auth status` confirms an authenticated GitHub CLI session, `gh auth setup-git --hostname github.com` can configure Git to use that existing credential helper. Confirm the actual remote branch with `git ls-remote`.

**Why:** A Vercel build failed resolving Replit's internal package-firewall hostname, and a direct Git push failed even though the GitHub CLI was authenticated.

**How to apply:** Before relying on a Vercel build, scan the lockfile for internal registry hosts and verify the public tarball URLs. Treat local commits, the GitHub remote, and Vercel deployment status as separate states.
