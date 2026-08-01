import { defineConfig } from 'vite';

const virtualDemo = {
  name: 'virtual-demo',
  resolveId(id) {
    if (id === './lazy-me' || id.endsWith('/src/lazy-me')) {
      return '\0virtual:lazy-me';
    }
  },
  load(id) {
    if (id === '\0virtual:lazy-me') {
      return 'export default "hello from a virtual module"';
    }
  },
};

export default defineConfig({
  experimental: { bundledDev: true },
  plugins: [virtualDemo],
});
