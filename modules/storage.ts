export type SavedFilter = { id: number; name: string; value: string };

const STORAGE_KEY_BASE = 'github-project-saved-filters';

function getProjectScopeFromUrl(url: string): string | null {
    try {
        const u = new URL(url);
        const parts = u.pathname.split('/').filter(Boolean);
        // patterns:
        // /orgs/{org}/projects/{projectId}
        if (parts[0] === 'orgs' && parts[2] === 'projects' && parts[3]) {
            const org = parts[1];
            const projectId = parts[3];
            return `org:${org}:project:${projectId}`;
        }
        // /users/{user}/projects/{projectId}/... (optional /views/...)
        if (parts[0] === 'users' && parts[2] === 'projects' && parts[3]) {
            const user = parts[1];
            const projectId = parts[3];
            return `user:${user}:project:${projectId}`;
        }
        // /{owner}/{repo}/projects/{projectId}
        if (parts.length >= 4 && parts[2] === 'projects' && parts[3]) {
            const owner = parts[0];
            const repo = parts[1];
            const projectId = parts[3];
            return `repo:${owner}/${repo}:project:${projectId}`;
        }
    } catch {
        // ignore
    }
    return null;
}

function getScopedKey(currentUrl?: string): string {
    const href = currentUrl || (typeof location !== 'undefined' ? location.href : '');
    const scope = href ? getProjectScopeFromUrl(href) : null;
    return scope ? `${STORAGE_KEY_BASE}:${scope}` : STORAGE_KEY_BASE;
}

export async function getSavedFilters(): Promise<SavedFilter[]> {
    const key = getScopedKey();
    return new Promise((resolve) => {
        chrome.storage.local.get([key], (result) => {
            const filters = Array.isArray(result[key]) ? result[key] : [];
            resolve(filters as SavedFilter[]);
        });
    });
}

export async function setSavedFilters(filters: SavedFilter[]): Promise<void> {
    const key = getScopedKey();
    return new Promise((resolve) => {
        chrome.storage.local.set({ [key]: filters }, () => resolve());
    });
}

export async function saveFilter(name: string, value: string): Promise<SavedFilter> {
    const filters = await getSavedFilters();
    const newFilter: SavedFilter = { id: Date.now(), name, value };
    filters.push(newFilter);
    await setSavedFilters(filters);
    return newFilter;
}

export async function deleteFilter(id: number): Promise<void> {
    const filters = await getSavedFilters();
    const updated = filters.filter((f) => f.id !== id);
    await setSavedFilters(updated);
}


