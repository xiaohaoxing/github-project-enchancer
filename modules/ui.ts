import { applyFilter, toFuzzyQuery } from './filter';
import { getSavedFilters, saveFilter, deleteFilter, type SavedFilter } from './storage';

const INPUT_ID = 'filter-bar-component-input';
const BUTTON_ID = 'tampermonkey-format-title-button';
const BUTTON_TEXT = 'Fuzzy';
const SAVE_BUTTON_ID = 'tampermonkey-save-filter-button';
const SAVE_BUTTON_TEXT = '⭐';
const DROPDOWN_ID = 'tampermonkey-saved-filters-dropdown';
const SAVE_POPOVER_ID = 'tampermonkey-save-filter-popover';
const TOOLBAR_ID = 'tampermonkey-filter-toolbar';
const WRAPPER_CLASS = 'tampermonkey-input-wrapper';
const MIN_INPUT_TEXT_AREA_WIDTH = 50;

let filterInput: HTMLInputElement | HTMLTextAreaElement | null = null;
let formatButton: HTMLButtonElement | null = null;
let saveButton: HTMLButtonElement | null = null;
let savedFiltersDropdown: HTMLDivElement | null = null;
let toolbar: HTMLDivElement | null = null;
let inputWrapper: HTMLDivElement | null = null;
let resizeObserver: ResizeObserver | null = null;
let savePopover: HTMLDivElement | null = null;

export function initToolbarAndButtons(): void {
    const mutationObserver = new MutationObserver(() => {
        const currentInput = document.getElementById(INPUT_ID);
        if (currentInput) {
            if (!inputWrapper || !inputWrapper.contains(currentInput) || !formatButton || !inputWrapper.contains(formatButton) || !toolbar || !document.body.contains(toolbar)) {
                setupInputAndButton();
            }
        } else if (filterInput) {
            setupInputAndButton();
        }
    });

    mutationObserver.observe(document.body, { childList: true, subtree: true });
    setTimeout(setupInputAndButton, 1000);
}

async function updateDropdown(dropdown?: HTMLSelectElement | null): Promise<void> {
    dropdown = dropdown || (document.getElementById(DROPDOWN_ID) as HTMLSelectElement | null);
    if (!dropdown) return;

    const filters = await getSavedFilters();
    dropdown.innerHTML = '';

    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = filters.length > 0 ? `Saved filters(${filters.length})` : 'No saved filters';
    dropdown.appendChild(defaultOption);

    filters.forEach((filter) => {
        const option = document.createElement('option');
        option.value = String(filter.id);
        option.textContent = filter.name;
        option.title = filter.value;
        dropdown.appendChild(option);
    });

    if (filters.length > 0) {
        const separator = document.createElement('option');
        separator.disabled = true;
        separator.textContent = '────────';
        dropdown.appendChild(separator);

        const manageOption = document.createElement('option');
        manageOption.value = 'manage';
        manageOption.textContent = 'Manage saved filters';
        manageOption.style.fontStyle = 'italic';
        dropdown.appendChild(manageOption);
    }

    dropdown.style.display = 'block';
}

async function updateMenu(container?: HTMLDivElement | null): Promise<void> {
    container = container || (document.getElementById(DROPDOWN_ID) as HTMLDivElement | null);
    if (!container) return;

    const filters = await getSavedFilters();
    container.innerHTML = '';

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.textContent = filters.length > 0 ? `Saved filters(${filters.length})` : 'No saved filters';
    trigger.className = 'btn btn-sm';
    trigger.style.height = '28px';
    trigger.style.fontSize = '12px';
    trigger.style.lineHeight = '18px';
    trigger.style.marginRight = '8px';
    trigger.style.padding = '4px 8px';
    trigger.style.cursor = 'pointer';

    const menu = document.createElement('div');
    menu.style.position = 'absolute';
    menu.style.top = '100%';
    menu.style.left = '0';
    menu.style.zIndex = '1000';
    menu.style.minWidth = '200px';
    menu.style.padding = '4px 0';
    menu.style.marginTop = '4px';
    menu.style.border = '1px solid var(--color-border-default, rgba(31, 35, 40, 0.15))';
    menu.style.borderRadius = '6px';
    menu.style.backgroundColor = 'var(--color-canvas-default, #ffffff)';
    menu.style.boxShadow = '0 8px 24px rgba(140, 149, 159, 0.2)';
    menu.style.display = 'none';

    const list = document.createElement('div');
    list.style.maxHeight = '320px';
    list.style.overflowY = 'auto';

    if (filters.length === 0) {
        const empty = document.createElement('div');
        empty.textContent = `No saved filters(${filters.length})`;
        empty.style.padding = '8px 12px';
        empty.style.fontSize = '12px';
        empty.style.color = 'var(--color-fg-muted, #57606a)';
        list.appendChild(empty);
    } else {
        filters.forEach((f) => {
            const row = document.createElement('div');
            row.style.display = 'flex';
            row.style.alignItems = 'center';
            row.style.gap = '10px';
            row.style.padding = '8px 12px';
            row.style.cursor = 'pointer';
            row.addEventListener('mouseenter', () => {
                row.style.backgroundColor = 'var(--color-canvas-subtle, #f6f8fa)';
            });
            row.addEventListener('mouseleave', () => {
                row.style.backgroundColor = 'transparent';
            });

            const nameSpan = document.createElement('span');
            nameSpan.textContent = f.name;
            nameSpan.title = f.value;
            nameSpan.style.flex = '1';
            nameSpan.style.fontSize = '12px';
            nameSpan.style.color = 'var(--color-fg-default, #24292f)';
            nameSpan.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                applyFilter(f.value);
                menu.style.display = 'none';
            });

            const delBtn = document.createElement('button');
            delBtn.type = 'button';
            delBtn.textContent = '';
            delBtn.title = 'Delete';
            delBtn.setAttribute('aria-label', 'Delete');
            delBtn.style.width = '22px';
            delBtn.style.height = '22px';
            delBtn.style.lineHeight = '20px';
            delBtn.style.fontSize = '12px';
            delBtn.style.textAlign = 'center';
            delBtn.style.border = '1px solid var(--color-border-default, rgba(31, 35, 40, 0.15))';
            delBtn.style.borderRadius = '4px';
            delBtn.style.background = 'var(--color-btn-bg, #f6f8fa)';
            delBtn.style.cursor = 'pointer';
            delBtn.style.marginLeft = '2px';
            // inline trash SVG
            {
                const svgNS = 'http://www.w3.org/2000/svg';
                const svg = document.createElementNS(svgNS, 'svg');
                svg.setAttribute('width', '12');
                svg.setAttribute('height', '12');
                svg.setAttribute('viewBox', '0 0 16 16');
                svg.setAttribute('aria-hidden', 'true');
                svg.style.display = 'block';
                svg.style.margin = 'auto';
                svg.style.color = 'var(--color-fg-default, #24292f)';
                const path = document.createElementNS(svgNS, 'path');
                path.setAttribute('fill', 'currentColor');
                // trash can icon path
                path.setAttribute('d', 'M6.5 1h3a.5.5 0 01.5.5V3h3a.5.5 0 010 1h-.5l-.7 9.1A2 2 0 0110.81 15H5.19a2 2 0 01-1.99-1.9L2.5 4H2a.5.5 0 010-1h3V1.5A.5.5 0 015.5 1h1zm1 .999h1V3h-1V1.999zM3.5 4l.69 9.01a1 1 0 00.99.99h5.64a1 1 0 00.99-.99L12.5 4h-9z');
                svg.appendChild(path);
                delBtn.appendChild(svg);
            }
            delBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                await deleteFilter(f.id);
                await updateMenu(container!);
            });

            row.appendChild(nameSpan);
            row.appendChild(delBtn);
            list.appendChild(row);
        });
    }

    menu.appendChild(list);

    function hideMenu() {
        menu.style.display = 'none';
        document.removeEventListener('click', onDocClick, true);
    }
    function onDocClick(ev: MouseEvent) {
        if (!container?.contains(ev.target as Node)) hideMenu();
    }

    trigger.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const next = menu.style.display === 'none' ? 'block' : 'none';
        menu.style.display = next;
        if (next === 'block') {
            document.addEventListener('click', onDocClick, true);
        } else {
            document.removeEventListener('click', onDocClick, true);
        }
    });

    container.style.position = 'relative';
    container.style.display = 'inline-block';
    container.appendChild(trigger);
    container.appendChild(menu);
}

function createMenu(): HTMLDivElement {
    const existing = document.getElementById(DROPDOWN_ID) as HTMLDivElement | null;
    if (existing) return existing;
    const container = document.createElement('div');
    container.id = DROPDOWN_ID;
    container.style.marginRight = '8px';
    void updateMenu(container);
    return container as HTMLDivElement;
}

function createSaveButton(): HTMLButtonElement {
    const existingButton = document.getElementById(SAVE_BUTTON_ID) as HTMLButtonElement | null;
    if (existingButton) return existingButton;

    const button = document.createElement('button');
    button.id = SAVE_BUTTON_ID;
    // Use inline SVG icon for save (star)
    button.textContent = '';
    button.setAttribute('aria-label', 'Save current filter');
    button.type = 'button';
    button.title = 'Save current filter';
    button.className = 'btn btn-sm';
    button.style.fontSize = '12px';
    button.style.lineHeight = '18px';
    button.style.height = '28px';

    button.style.display = 'inline-flex';
    button.style.alignItems = 'center';
    button.style.gap = '4px';
    button.style.marginLeft = '0';
    button.style.padding = '4px 8px';
    button.style.minWidth = 'auto';
    button.style.fontWeight = '500';

    // Insert star SVG
    {
        const svgNS = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(svgNS, 'svg');
        svg.setAttribute('width', '16');
        svg.setAttribute('height', '16');
        svg.setAttribute('viewBox', '0 0 16 16');
        svg.setAttribute('aria-hidden', 'true');
        svg.style.display = 'block';
        svg.style.color = 'var(--color-fg-default, #24292f)';
        const path = document.createElementNS(svgNS, 'path');
        path.setAttribute('fill', 'currentColor');
        // star icon path
        path.setAttribute('d', 'M8 12.027 3.693 14.5l.82-4.781L1 6.5l4.846-.703L8 1.5l2.154 4.297L15 6.5l-3.513 3.219.82 4.781L8 12.027z');
        svg.appendChild(path);
        button.appendChild(svg);
    }

    button.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        showSavePopover(button);
    });

    return button as HTMLButtonElement;
}

function createDropdown(): HTMLSelectElement {
    const existingDropdown = document.getElementById(DROPDOWN_ID) as HTMLSelectElement | null;
    if (existingDropdown) return existingDropdown;

    const dropdown = document.createElement('select');
    dropdown.id = DROPDOWN_ID;
    dropdown.className = 'form-select select-sm';

    dropdown.style.minWidth = '120px';
    dropdown.style.maxWidth = '200px';
    dropdown.style.marginRight = '8px';
    dropdown.style.height = '28px';
    dropdown.style.fontSize = '12px';
    dropdown.style.lineHeight = '18px';
    dropdown.style.paddingLeft = '12px';
    dropdown.style.paddingRight = '32px';
    dropdown.style.border = '1px solid var(--color-border-default, rgba(31, 35, 40, 0.15))';
    dropdown.style.borderRadius = '6px';
    dropdown.style.backgroundColor = 'var(--color-canvas-default, #ffffff)';
    dropdown.style.color = 'var(--color-fg-default, #24292f)';
    dropdown.style.backgroundImage = 'url("data:image/svg+xml,%3Csvg width=\'16\' height=\'16\' viewBox=\'0 0 16 16\' fill=\'%23586069\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M4.427 7.427l3.396 3.396a.25.25 0 00.354 0l3.396-3.396A.25.25 0 0011.396 7H4.604a.25.25 0 00-.177.427z\'/%3E%3C/svg%3E")';
    dropdown.style.backgroundRepeat = 'no-repeat';
    dropdown.style.backgroundPosition = 'right 8px center';
    dropdown.style.backgroundSize = '16px';
    dropdown.style.appearance = 'none';
    dropdown.style.cursor = 'pointer';

    dropdown.addEventListener('change', async (event) => {
        const selectedValue = (event.target as HTMLSelectElement).value;
        if (!selectedValue) return;

        if (selectedValue === 'manage') {
            await showManageFiltersDialog();
        } else {
            const selectedId = parseInt(selectedValue, 10);
            const filters = await getSavedFilters();
            const filter = filters.find((f) => f.id === selectedId);
            if (filter) applyFilter(filter.value);
        }
        (event.target as HTMLSelectElement).value = '';
    });

    void updateDropdown(dropdown);
    return dropdown as HTMLSelectElement;
}

function createFormatButton(): HTMLButtonElement {
    const existingButton = document.getElementById(BUTTON_ID) as HTMLButtonElement | null;
    if (existingButton) return existingButton;

    const button = document.createElement('button');
    button.id = BUTTON_ID;
    button.textContent = BUTTON_TEXT;
    button.type = 'button';
    button.title = 'Convert to fuzzy query';
    button.className = 'btn-sm';

    button.style.position = 'absolute';
    button.style.top = '50%';
    button.style.right = '28px';
    button.style.transform = 'translateY(-50%)';
    button.style.zIndex = '10';
    button.style.padding = '3px 8px';
    button.style.fontSize = '12px';
    button.style.height = '24px';
    button.style.lineHeight = '1';
    button.style.display = 'inline-flex';
    button.style.alignItems = 'center';
    button.style.justifyContent = 'center';
    button.style.border = '1px solid var(--color-border-default, rgba(31, 35, 40, 0.15))';
    button.style.borderRadius = '6px';
    button.style.backgroundColor = 'var(--color-btn-bg, #f6f8fa)';
    button.style.color = 'var(--color-fg-default, #24292f)';
    button.style.cursor = 'pointer';
    button.style.fontWeight = '500';
    button.style.whiteSpace = 'nowrap';
    button.style.transition = 'background-color 0.2s, border-color 0.2s';

    button.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        const currentDomInput = document.getElementById(INPUT_ID) as HTMLInputElement | HTMLTextAreaElement | null;
        if (!currentDomInput) return;
        filterInput = currentDomInput;
        const raw = filterInput.value.trim();
        if (raw !== '') applyFilter(toFuzzyQuery(raw));
    });
    return button as HTMLButtonElement;
}

function createToolbar(): HTMLDivElement {
    const existingToolbar = document.getElementById(TOOLBAR_ID) as HTMLDivElement | null;
    if (existingToolbar) return existingToolbar;

    const bar = document.createElement('div');
    bar.id = TOOLBAR_ID;
    bar.style.display = 'flex';
    bar.style.alignItems = 'center';
    bar.style.marginBottom = '4px';
    bar.style.gap = '0';
    bar.style.paddingLeft = '0';
    bar.style.paddingRight = '0';
    bar.style.width = 'auto';
    return bar as HTMLDivElement;
}

function adjustLayout(): void {
    if (!filterInput || !inputWrapper || !formatButton) return;
    filterInput.style.width = '100%';
    filterInput.style.boxSizing = 'border-box';

    const wasButtonHidden = formatButton.style.display === 'none';
    if (wasButtonHidden) {
        formatButton.style.visibility = 'hidden';
        formatButton.style.display = 'inline-flex';
    }
    const buttonActualWidth = formatButton.offsetWidth;
    if (wasButtonHidden) {
        formatButton.style.display = 'none';
        formatButton.style.visibility = 'visible';
    }

    const wrapperInnerWidth = inputWrapper.clientWidth -
        (parseFloat(getComputedStyle(inputWrapper).paddingLeft) || 0) -
        (parseFloat(getComputedStyle(inputWrapper).paddingRight) || 0);

    const spaceForButtonAndGap = buttonActualWidth + 16;
    if (buttonActualWidth > 0 && (wrapperInnerWidth - spaceForButtonAndGap) >= MIN_INPUT_TEXT_AREA_WIDTH) {
        filterInput.style.paddingRight = `${spaceForButtonAndGap}px`;
        formatButton.style.display = 'inline-flex';
    } else {
        filterInput.style.paddingRight = '8px';
        formatButton.style.display = 'none';
    }
}

function setupInputAndButton(): void {
    const currentDomInput = document.getElementById(INPUT_ID) as HTMLInputElement | HTMLTextAreaElement | null;
    if (!currentDomInput) {
        if (resizeObserver && inputWrapper) resizeObserver.unobserve(inputWrapper);
        if (formatButton && formatButton.parentNode) formatButton.parentNode.removeChild(formatButton);
        if (toolbar && toolbar.parentNode) toolbar.parentNode.removeChild(toolbar);
        if (inputWrapper && inputWrapper.parentNode && inputWrapper.classList.contains(WRAPPER_CLASS)) {
            const originalParent = inputWrapper.parentNode as HTMLElement;
            if (filterInput && document.body.contains(filterInput) && filterInput.parentElement !== originalParent) {
                originalParent.insertBefore(filterInput, inputWrapper);
                (filterInput as HTMLInputElement).style.paddingRight = '';
                (filterInput as HTMLInputElement).style.width = '';
            }
            originalParent.removeChild(inputWrapper);
        }
        filterInput = null;
        inputWrapper = null;
        formatButton = null;
        toolbar = null;
        saveButton = null;
        savedFiltersDropdown = null;
        return;
    }

    filterInput = currentDomInput;

    if (filterInput.parentElement && filterInput.parentElement.classList.contains(WRAPPER_CLASS)) {
        inputWrapper = filterInput.parentElement as HTMLDivElement;
    } else {
        inputWrapper = document.createElement('div');
        inputWrapper.classList.add(WRAPPER_CLASS);
        inputWrapper.style.position = 'relative';
        const originalInputComputedStyle = getComputedStyle(filterInput);
        inputWrapper.style.display = originalInputComputedStyle.display;
        if (originalInputComputedStyle.display === 'block' || originalInputComputedStyle.display === 'flex') {
            inputWrapper.style.width = '100%';
        } else if (originalInputComputedStyle.display === 'inline-block') {
            if (originalInputComputedStyle.width !== 'auto' && !originalInputComputedStyle.width.includes('%')) {
                inputWrapper.style.width = originalInputComputedStyle.width;
            }
        }
        if (filterInput.parentElement && getComputedStyle(filterInput.parentElement).display.includes('flex')) {
            // copy flex attrs
            (inputWrapper.style as any).flexGrow = (originalInputComputedStyle as any).flexGrow;
            (inputWrapper.style as any).flexShrink = (originalInputComputedStyle as any).flexShrink;
            (inputWrapper.style as any).flexBasis = (originalInputComputedStyle as any).flexBasis;
        }
        if (filterInput.parentNode) {
            filterInput.parentNode.insertBefore(inputWrapper, filterInput);
            inputWrapper.appendChild(filterInput);
        } else {
            console.warn('[WXT] Filter input has no parent, cannot wrap.');
            return;
        }
    }

    if (!formatButton || !inputWrapper.contains(formatButton)) {
        formatButton = createFormatButton();
        inputWrapper.appendChild(formatButton);
    }

    let formContainer = filterInput.closest('[id="filter-bar-component"]');
    if (!formContainer) {
        console.warn('[WXT] Could not find filter-bar-component');
        return;
    }
    let filterContainer = formContainer.closest('.tokenized-filter-input-module__Box--w5A7b') as HTMLElement | null;
    if (!filterContainer) {
        filterContainer = formContainer.parentElement as HTMLElement | null;
        if (!filterContainer) {
            console.warn('[WXT] Could not find tokenized filter container');
            return;
        }
    }

    if (!toolbar || !document.body.contains(toolbar)) {
        toolbar = createToolbar();
        if (filterContainer.parentNode) {
            filterContainer.parentNode.insertBefore(toolbar, filterContainer);
        } else {
            console.warn('[WXT] Could not insert toolbar');
            return;
        }
    }

    if (!savedFiltersDropdown || !toolbar.contains(savedFiltersDropdown)) {
        savedFiltersDropdown = createMenu();
        toolbar.appendChild(savedFiltersDropdown);
    }

    if (!saveButton || !toolbar.contains(saveButton)) {
        saveButton = createSaveButton();
        toolbar.appendChild(saveButton);
    }

    adjustLayout();
    if (typeof ResizeObserver !== 'undefined') {
        if (resizeObserver) resizeObserver.disconnect();
        resizeObserver = new ResizeObserver(() => {
            requestAnimationFrame(adjustLayout);
        });
        if (inputWrapper) resizeObserver.observe(inputWrapper);
    }

    void updateMenu();
}

function showSavePopover(anchor: HTMLElement): void {
    const currentDomInput = document.getElementById(INPUT_ID) as HTMLInputElement | HTMLTextAreaElement | null;
    if (!currentDomInput) return;
    filterInput = currentDomInput;

    if (savePopover && document.body.contains(savePopover)) {
        savePopover.remove();
    }

    savePopover = document.createElement('div');
    savePopover.id = SAVE_POPOVER_ID;
    savePopover.style.position = 'absolute';
    savePopover.style.zIndex = '1000';
    savePopover.style.padding = '8px';
    savePopover.style.border = '1px solid var(--color-border-default, rgba(31, 35, 40, 0.15))';
    savePopover.style.borderRadius = '6px';
    savePopover.style.background = 'var(--color-canvas-default, #ffffff)';
    savePopover.style.boxShadow = '0 8px 24px rgba(140, 149, 159, 0.2)';
    savePopover.style.fontSize = '12px';

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Filter name';
    input.value = (filterInput.value || '').trim().substring(0, 20);
    input.style.width = '180px';
    input.style.marginRight = '6px';
    input.style.padding = '4px 6px';
    input.style.border = '1px solid var(--color-border-default, rgba(31, 35, 40, 0.15))';
    input.style.borderRadius = '4px';

    const saveBtn = document.createElement('button');
    saveBtn.type = 'button';
    saveBtn.textContent = 'Save';
    saveBtn.className = 'btn btn-sm';
    saveBtn.style.height = '24px';
    saveBtn.style.padding = '2px 8px';
    saveBtn.style.marginRight = '6px';

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.className = 'btn btn-sm';
    cancelBtn.style.height = '24px';
    cancelBtn.style.padding = '2px 8px';

    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.alignItems = 'center';
    row.appendChild(input);
    row.appendChild(saveBtn);
    row.appendChild(cancelBtn);
    savePopover.appendChild(row);

    function close() {
        document.removeEventListener('click', onDoc, true);
        document.removeEventListener('keydown', onKey, true);
        if (savePopover && savePopover.parentNode) savePopover.parentNode.removeChild(savePopover);
        savePopover = null;
    }
    async function doSave() {
        const name = input.value.trim();
        const value = filterInput?.value?.trim() || '';
        if (!name || !value) {
            close();
            return;
        }
        await saveFilter(name, value);
        await updateMenu();
        close();
    }
    function onDoc(ev: MouseEvent) {
        if (!savePopover?.contains(ev.target as Node) && ev.target !== anchor) close();
    }
    function onKey(ev: KeyboardEvent) {
        if (ev.key === 'Escape') close();
        if (ev.key === 'Enter') {
            ev.preventDefault();
            void doSave();
        }
    }

    saveBtn.addEventListener('click', () => void doSave());
    cancelBtn.addEventListener('click', () => close());

    document.addEventListener('click', onDoc, true);
    document.addEventListener('keydown', onKey, true);

    const rect = anchor.getBoundingClientRect();
    savePopover.style.top = `${rect.bottom + window.scrollY + 6}px`;
    savePopover.style.left = `${rect.left + window.scrollX}px`;

    document.body.appendChild(savePopover);
    input.focus();
}

async function showManageFiltersDialog(): Promise<void> {
    const filters = await getSavedFilters();
    if (filters.length === 0) {
        alert('No saved filters');
        return;
    }
    let message = 'Saved filters:\n\n';
    filters.forEach((filter, index) => {
        message += `${index + 1}. ${filter.name}\n   Value: ${filter.value}\n\n`;
    });
    message += `\nEnter the index to delete (1-${filters.length}), or cancel:`;
    const input = prompt(message);
    if (input) {
        const index = parseInt(input, 10) - 1;
        if (index >= 0 && index < filters.length) {
            const filterToDelete = filters[index] as SavedFilter;
            if (confirm(`Delete "${filterToDelete.name}"?`)) {
                await deleteFilter(filterToDelete.id);
                alert('Filter deleted');
                await updateDropdown();
            }
        } else {
            alert('Invalid index');
        }
    }
}


