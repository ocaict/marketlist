import type { CapacitorConfig } from '@capacitor/cli';

const androidDebug = process.env.CAPACITOR_ANDROID_DEBUG === 'true';

const config: CapacitorConfig = {
  appId: 'com.marketlist.app',
  appName: 'MarketList',
  webDir: 'dist',
  server: {
    androidScheme: androidDebug ? 'http' : 'https',
    cleartext: androidDebug,
  },
};

export default config;
