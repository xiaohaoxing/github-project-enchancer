import { defineContentScript } from 'wxt/sandbox';
import { initToolbarAndButtons } from '@/modules/ui';

export default defineContentScript({
    matches: [
        'https://github.com/orgs/*/projects/*',
        'https://github.com/*/*/projects/*'
    ],
    runAt: 'document_idle',
    main() {
        initToolbarAndButtons();
    }
});


