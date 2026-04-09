/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    domains: ['localhost'],
  },
  webpack: (config, { dev }) => {
    if (!dev) {
      config.cache = false
    }

    return config
  },
}

module.exports = nextConfig
