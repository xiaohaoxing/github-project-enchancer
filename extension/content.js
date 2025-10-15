(function () {
    'use strict';

    // Constants
    const INPUT_ID = 'filter-bar-component-input';
    const BUTTON_ID = 'tampermonkey-format-title-button';
    const BUTTON_TEXT = '模糊';
    const SAVE_BUTTON_ID = 'tampermonkey-save-filter-button';
    const SAVE_BUTTON_TEXT = '⭐';
    const DROPDOWN_ID = 'tampermonkey-saved-filters-dropdown';
    const TOOLBAR_ID = 'tampermonkey-filter-toolbar';
    const WRAPPER_CLASS = 'tampermonkey-input-wrapper';
    const MIN_INPUT_TEXT_AREA_WIDTH = 50;
    const STORAGE_KEY = 'github-project-saved-filters';

    // State
    let filterInput = null;
    let formatButton = null;
    let saveButton = null;
    let savedFiltersDropdown = null;
    let toolbar = null;
    let inputWrapper = null;
    let resizeObserver = null;

    // Storage helpers (chrome.storage.local)
    function getSavedFilters() {
        return new Promise((resolve) => {
            chrome.storage.local.get([STORAGE_KEY], (result) => {
                const filters = Array.isArray(result[STORAGE_KEY]) ? result[STORAGE_KEY] : [];
                resolve(filters);
            });
        });
    }

    function setSavedFilters(filters) {
        return new Promise((resolve) => {
            chrome.storage.local.set({ [STORAGE_KEY]: filters }, () => resolve());
        });
    }

    async function saveFilter(name, value) {
        const filters = await getSavedFilters();
        const newFilter = { name, value, id: Date.now() };
        filters.push(newFilter);
        await setSavedFilters(filters);
        await updateDropdown();
        return newFilter;
    }

    async function deleteFilter(id) {
        const filters = await getSavedFilters();
        const updated = filters.filter((f) => f.id !== id);
        await setSavedFilters(updated);
        await updateDropdown();
    }

    async function showManageFiltersDialog() {
        const filters = await getSavedFilters();
        if (filters.length === 0) {
            alert('没有保存的筛选条件');
            return;
        }

        let message = '已保存的筛选条件：\n\n';
        filters.forEach((filter, index) => {
            message += `${index + 1}. ${filter.name}\n   值: ${filter.value}\n\n`;
        });
        message += `\n输入要删除的筛选条件编号（1-${filters.length}），或点击取消：`;

        const input = prompt(message);
        if (input) {
            const idx = parseInt(input, 10) - 1;
            if (idx >= 0 && idx < filters.length) {
                const filterToDelete = filters[idx];
                if (confirm(`确定要删除"${filterToDelete.name}"吗？`)) {
                    await deleteFilter(filterToDelete.id);
                    alert('筛选条件已删除');
                }
            } else {
                alert('无效的编号');
            }
        }
    }

    function applyFilter(value) {
        const currentDomInput = document.getElementById(INPUT_ID);
        if (!currentDomInput) return;
        filterInput = currentDomInput;

        const valueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set ||
            Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
        if (valueSetter) {
            valueSetter.call(filterInput, value);
        } else {
            filterInput.value = value;
        }
        const inputEvent = new Event('input', { bubbles: true, cancelable: true });
        filterInput.dispatchEvent(inputEvent);
        filterInput.focus();
    }

    function createSaveButton() {
        const existingButton = document.getElementById(SAVE_BUTTON_ID);
        if (existingButton) {
            return existingButton;
        }

        const button = document.createElement('button');
        button.id = SAVE_BUTTON_ID;
        button.textContent = SAVE_BUTTON_TEXT;
        button.type = 'button';
        button.title = '保存当前筛选条件';
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

        button.addEventListener('mouseenter', () => {
            button.classList.add('btn-hover');
        });
        button.addEventListener('mouseleave', () => {
            button.classList.remove('btn-hover');
        });

        button.addEventListener('click', async (event) => {
            event.preventDefault();
            event.stopPropagation();

            const currentDomInput = document.getElementById(INPUT_ID);
            if (!currentDomInput) return;
            filterInput = currentDomInput;

            if (filterInput.value.trim() !== '') {
                const filterName = prompt('请输入筛选条件的名称：', filterInput.value.substring(0, 20));
                if (filterName && filterName.trim()) {
                    await saveFilter(filterName.trim(), filterInput.value);
                    alert('筛选条件已保存！');
                }
            } else {
                alert('请先输入筛选条件');
            }
        });

        return button;
    }

    function createDropdown() {
        const existingDropdown = document.getElementById(DROPDOWN_ID);
        if (existingDropdown) {
            return existingDropdown;
        }

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

        dropdown.addEventListener('mouseenter', () => {
            dropdown.style.borderColor = 'var(--color-border-muted, rgba(31, 35, 40, 0.3))';
            dropdown.style.backgroundColor = 'var(--color-canvas-subtle, #f6f8fa)';
        });
        dropdown.addEventListener('mouseleave', () => {
            dropdown.style.borderColor = 'var(--color-border-default, rgba(31, 35, 40, 0.15))';
            dropdown.style.backgroundColor = 'var(--color-canvas-default, #ffffff)';
        });

        dropdown.addEventListener('focus', () => {
            dropdown.style.outline = '2px solid var(--color-accent-fg, #0969da)';
            dropdown.style.outlineOffset = '-1px';
        });
        dropdown.addEventListener('blur', () => {
            dropdown.style.outline = 'none';
        });

        dropdown.addEventListener('change', async (event) => {
            const selectedValue = event.target.value;
            if (!selectedValue) return;

            if (selectedValue === 'manage') {
                await showManageFiltersDialog();
            } else {
                const selectedId = parseInt(selectedValue, 10);
                const filters = await getSavedFilters();
                const filter = filters.find((f) => f.id === selectedId);
                if (filter) {
                    applyFilter(filter.value);
                }
            }

            dropdown.value = '';
        });

        updateDropdown(dropdown);
        return dropdown;
    }

    async function updateDropdown(dropdown) {
        dropdown = dropdown || document.getElementById(DROPDOWN_ID);
        if (!dropdown) return;

        const filters = await getSavedFilters();
        dropdown.innerHTML = '';

        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = filters.length > 0 ? '常用筛选...' : '无保存的筛选';
        dropdown.appendChild(defaultOption);

        filters.forEach((filter) => {
            const option = document.createElement('option');
            option.value = filter.id;
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
            manageOption.textContent = '🗑️ 管理筛选条件';
            manageOption.style.fontStyle = 'italic';
            dropdown.appendChild(manageOption);
        }

        dropdown.style.display = filters.length > 0 ? 'block' : 'none';
    }

    function createFormatButton() {
        const existingButton = document.getElementById(BUTTON_ID);
        if (existingButton) {
            return existingButton;
        }

        const button = document.createElement('button');
        button.id = BUTTON_ID;
        button.textContent = BUTTON_TEXT;
        button.type = 'button';
        button.title = '转换为模糊搜索格式';
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

        button.addEventListener('mouseenter', () => {
            button.style.backgroundColor = 'var(--color-btn-hover-bg, #f3f4f6)';
            button.style.borderColor = 'var(--color-border-muted, rgba(31, 35, 40, 0.3))';
        });
        button.addEventListener('mouseleave', () => {
            button.style.backgroundColor = 'var(--color-btn-bg, #f6f8fa)';
            button.style.borderColor = 'var(--color-border-default, rgba(31, 35, 40, 0.15))';
        });

        button.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            const currentDomInput = document.getElementById(INPUT_ID);
            if (!currentDomInput) return;
            filterInput = currentDomInput;

            if (filterInput.value.trim() !== '') {
                const originalValue = filterInput.value;
                const newValue = `title:*${originalValue}*`;
                applyFilter(newValue);
            }
        });
        return button;
    }

    function createToolbar() {
        const existingToolbar = document.getElementById(TOOLBAR_ID);
        if (existingToolbar) {
            return existingToolbar;
        }

        const bar = document.createElement('div');
        bar.id = TOOLBAR_ID;
        bar.style.display = 'flex';
        bar.style.alignItems = 'center';
        bar.style.marginBottom = '4px';
        bar.style.gap = '0';
        bar.style.paddingLeft = '0';
        bar.style.paddingRight = '0';
        bar.style.width = 'auto';
        return bar;
    }

    function adjustLayout() {
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

    function setupInputAndButton() {
        const currentDomInput = document.getElementById(INPUT_ID);

        if (!currentDomInput) {
            if (resizeObserver && inputWrapper) {
                resizeObserver.unobserve(inputWrapper);
            }
            if (formatButton && formatButton.parentNode) formatButton.parentNode.removeChild(formatButton);
            if (toolbar && toolbar.parentNode) toolbar.parentNode.removeChild(toolbar);
            if (inputWrapper && inputWrapper.parentNode && inputWrapper.classList.contains(WRAPPER_CLASS)) {
                const originalParent = inputWrapper.parentNode;
                if (filterInput && document.body.contains(filterInput) && filterInput.parentElement !== originalParent) {
                    originalParent.insertBefore(filterInput, inputWrapper);
                    filterInput.style.paddingRight = '';
                    filterInput.style.width = '';
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
            inputWrapper = filterInput.parentElement;
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
                inputWrapper.style.flexGrow = originalInputComputedStyle.flexGrow;
                inputWrapper.style.flexShrink = originalInputComputedStyle.flexShrink;
                inputWrapper.style.flexBasis = originalInputComputedStyle.flexBasis;
            }

            if (filterInput.parentNode) {
                filterInput.parentNode.insertBefore(inputWrapper, filterInput);
                inputWrapper.appendChild(filterInput);
            } else {
                console.warn('[Extension] Filter input has no parent, cannot wrap.');
                return;
            }
        }

        if (!formatButton || !inputWrapper.contains(formatButton)) {
            formatButton = createFormatButton();
            inputWrapper.appendChild(formatButton);
        }

        let formContainer = filterInput.closest('[id="filter-bar-component"]');
        if (!formContainer) {
            console.warn('[Extension] Could not find filter-bar-component');
            return;
        }

        let filterContainer = formContainer.closest('.tokenized-filter-input-module__Box--w5A7b');
        if (!filterContainer) {
            filterContainer = formContainer.parentElement;
            if (!filterContainer) {
                console.warn('[Extension] Could not find tokenized filter container');
                return;
            }
        }

        if (!toolbar || !document.body.contains(toolbar)) {
            toolbar = createToolbar();
            if (filterContainer.parentNode) {
                filterContainer.parentNode.insertBefore(toolbar, filterContainer);
            } else {
                console.warn('[Extension] Could not insert toolbar');
                return;
            }
        }

        if (!savedFiltersDropdown || !toolbar.contains(savedFiltersDropdown)) {
            savedFiltersDropdown = createDropdown();
            toolbar.appendChild(savedFiltersDropdown);
        }

        if (!saveButton || !toolbar.contains(saveButton)) {
            saveButton = createSaveButton();
            toolbar.appendChild(saveButton);
        }

        adjustLayout();

        if (typeof ResizeObserver !== 'undefined') {
            if (resizeObserver) {
                resizeObserver.disconnect();
            }
            resizeObserver = new ResizeObserver(() => {
                requestAnimationFrame(adjustLayout);
            });
            if (inputWrapper) {
                resizeObserver.observe(inputWrapper);
            }
        }

        updateDropdown();
    }

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
})();


