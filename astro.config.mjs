import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

// In GitHub Actions, GITHUB_REPOSITORY is "owner/repo" — use it to derive the
// site URL and base path automatically so this works for any fork without
// hardcoding.
const ghRepo = process.env.GITHUB_REPOSITORY;
const [owner, repo] = (ghRepo || '').split('/');
const inCI = !!ghRepo;

export default defineConfig({
  integrations: [react()],
  site: inCI ? `https://${owner}.github.io` : 'http://localhost:4321',
  base: inCI ? `/${repo}/` : '/',
});