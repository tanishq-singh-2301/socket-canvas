/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')

const nextConfig = {
  reactStrictMode: true,
  // pwa: {
  //   dest: 'public',
  //   sw: 'service-worker.js'
  // }
}

module.exports = nextConfig;