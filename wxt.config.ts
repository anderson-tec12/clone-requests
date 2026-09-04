import { defineConfig } from 'wxt';

export default defineConfig({
  manifest: {
    name: 'clone-requests',
    description:
      'Clona requisições de API (URL, headers, query, payload e resposta) para consultar e repetir.',
    version: '1.2.0',
    permissions: [
      'sidePanel',
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
