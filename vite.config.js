import process from 'node:process'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { sentryVitePlugin } from '@sentry/vite-plugin'

// Source maps exist only for the build that uploads them. The token arrives from CI as a
// BuildKit secret; a local build or the pre-image CI build has none and emits no maps.
// 'hidden' keeps the sourceMappingURL comment out of the bundle, since the map files are
// deleted after upload and a dangling reference would 404 in every devtools session.
const uploadSourceMaps = !!process.env.SENTRY_AUTH_TOKEN

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    ...(uploadSourceMaps
      ? [
          sentryVitePlugin({
            org: 'the-game-cellar',
            project: 'frontend',
            authToken: process.env.SENTRY_AUTH_TOKEN,
            release: { name: process.env.SENTRY_RELEASE },
            sourcemaps: { filesToDeleteAfterUpload: ['./dist/**/*.map'] },
            telemetry: false,
            // A failed upload must fail the build, or a lost token ships a bundle whose
            // stack traces are unreadable. The plugin's default logged the error and let
            // the build exit 0.
            errorHandler: (err) => {
              throw err
            },
          }),
        ]
      : []),
  ],
  build: {
    sourcemap: uploadSourceMaps ? 'hidden' : false,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    env: {
      VITE_API_URL: 'http://api.test',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{js,jsx,ts,tsx}'],
      exclude: [
        'src/test/**',
        'src/**/*.test.{js,jsx,ts,tsx}',
        'src/main.tsx',
        'src/types/api/**',
        'src/vite-env.d.ts',
      ],
    },
  },
})
