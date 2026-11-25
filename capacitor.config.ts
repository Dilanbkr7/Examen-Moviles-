import type { CapacitorConfig } from '@capacitor/cli';

// ADR-004: Capacitor integra la app web con Android.
const config: CapacitorConfig = {
  appId: 'ec.esfot.controlelectoral',
  appName: 'Control Electoral',
  webDir: 'dist',
};

export default config;
