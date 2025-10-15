export type SavedFilter = { id: number; name: string; value: string };

const STORAGE_KEY = 'github-project-saved-filters';

export async function getSavedFilters(): Promise<SavedFilter[]> {
    return new Promise((resolve) => {
        chrome.storage.local.get([STORAGE_KEY], (result) => {
            const filters = Array.isArray(result[STORAGE_KEY]) ? result[STORAGE_KEY] : [];
            resolve(filters as SavedFilter[]);
        });
    });
}

export async function setSavedFilters(filters: SavedFilter[]): Promise<void> {
    return new Promise((resolve) => {
        chrome.storage.local.set({ [STORAGE_KEY]: filters }, () => resolve());
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


