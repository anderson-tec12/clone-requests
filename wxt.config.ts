import { defineConfig } from 'wxt';

export default defineConfig({
  outDir: 'deploy',
  manifest: {
    name: 'clone-requests',
    description:
      'Grave, consulte e repita requisições de API (fetch e XHR): URL, headers, payload, cURL e arquivo .http.',
    version: '1.2.0',
    permissions: [
      'storage',
      'scripting',
      'activeTab',
      'tabs',
      'windows',
      'webNavigation',
    ],
    optional_host_permissions: ['*://*/*'],
    action: {
      default_title: 'clone-requests',
      default_icon: {
        16: 'icon-16.png',
        32: 'icon-32.png',
        48: 'icon-48.png',
        128: 'icon-128.png',
      },
    },
    icons: {
      16: 'icon-16.png',
      32: 'icon-32.png',
      48: 'icon-48.png',
      128: 'icon-128.png',
    },
  },
});
