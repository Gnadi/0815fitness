import { defineConfig } from 'vitest/config';

// The suite covers the pure logic — day arithmetic, derivations, load, routes, the
// recorder's state machine, the backup format — which is where the figures the app
// shows are actually decided. It deliberately does not render components: the screens
// are a projection of these functions, and they are what a wrong number comes from.
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
