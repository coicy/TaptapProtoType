import { defineConfig } from 'vite';

const repository = process.env.GITHUB_REPOSITORY?.split('/')[1];
const owner = process.env.GITHUB_REPOSITORY_OWNER;
const isUserSite = Boolean(repository && owner && repository.toLowerCase() === `${owner.toLowerCase()}.github.io`);
const base = process.env.GITHUB_ACTIONS && repository && !isUserSite ? `/${repository}/` : '/';

export default defineConfig({
  base,
  build: {
    rollupOptions: {
      input: {
        index: 'index.html',
        settlement: 'settlement.html',
      },
    },
  },
});
