import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { crx } from '@crxjs/vite-plugin'
import manifestJson from './manifest.json'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode, command }) => {
  const dynamicManifest = { ...manifestJson } as any

  if (command === 'build' && dynamicManifest.host_permissions) {
    dynamicManifest.host_permissions = dynamicManifest.host_permissions.filter(
      (url: string) => !url.includes('localhost') && !url.includes('127.0.0.1')
    )
  }

  if (mode === 'development') {
    dynamicManifest.name = '[DEV] sitecue'
    dynamicManifest.icons = {
      '16': 'sitecue_icon_dev_16.png',
      '32': 'sitecue_icon_dev_32.png',
      '48': 'sitecue_icon_dev_48.png',
      '128': 'sitecue_icon_dev_128.png',
    }
    dynamicManifest.action = {
      ...dynamicManifest.action,
      default_icon: {
        '16': 'sitecue_icon_dev_16.png',
        '32': 'sitecue_icon_dev_32.png',
        '48': 'sitecue_icon_dev_48.png',
        '128': 'sitecue_icon_dev_128.png',
      },
    }
  }

  return {
    plugins: [
      react(),
      tailwindcss(),
      crx({ manifest: dynamicManifest }),
    ],
    server: {
      port: 5173,
      strictPort: true,
      hmr: {
        port: 5173,
      },
      cors: true,
    },
  }
})
