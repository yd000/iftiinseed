const withPWA = require('next-pwa');

/** @type {import('next').NextConfig} */
const nextConfig = withPWA({
  reactStrictMode: false,
  pwa: {
    dest: 'public',
    register: true,
    skipWaiting: true,
    disable: process.env.NODE_ENV === 'development',
  },
  i18n: {
    locales: ['en'],
    defaultLocale: 'en',
  },
  compiler:
    process.env.NODE_ENV === 'production'
      ? {
          removeConsole: {
            exclude: ['error'],
          },
        }
      : {},
});

module.exports = nextConfig;
