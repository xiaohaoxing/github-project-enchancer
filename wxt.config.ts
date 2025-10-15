import { defineConfig } from 'wxt';

export default defineConfig({
    vite: () => ({
        optimizeDeps: {
            exclude: ['chokidar', 'fsevents', 'web-ext-run']
        }
    }),
    manifest: {
        manifest_version: 3,
        name: 'GitHub Project Filter Enhancer',
        description: '在 GitHub Projects 页面添加一键模糊搜索与常用筛选收藏（基于 WXT）。',
        version: '3.1.0',
        permissions: [
            'storage'
        ],
        host_permissions: [
            'https://github.com/*'
        ]
    }
});


