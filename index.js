// ==UserScript==
// @name         GitHub Project Filter Formatter (Responsive Button Inside)
// @namespace    http://tampermonkey.net/
// @version      1.6
// @description  Adds a responsive button inside and to the right of GitHub project filter input to format text as title:*XX*.
// @author       xiaohaoxing
// @match        https://github.com/orgs/.*/projects/.*
// @match        https://github.com/*/*/projects/*
// @grant        none
// @icon         https://github.githubassets.com/favicons/favicon.svg
// @license      MIT
// ==/UserScript==
 
(function() {
    'use strict';
 
    const INPUT_ID = 'filter-bar-component-input';
    const BUTTON_ID = 'tampermonkey-format-title-button';
    const BUTTON_TEXT = '模糊';
    const WRAPPER_CLASS = 'tampermonkey-input-wrapper';
    const MIN_INPUT_TEXT_AREA_WIDTH = 50; // Minimum pixels for text before button (if button shown)
 
    let filterInput = null;
    let formatButton = null;
    let inputWrapper = null;
    let resizeObserver = null; // To observe wrapper/input size changes
 
    function createFormatButton() {
        const existingButton = document.getElementById(BUTTON_ID);
        if (existingButton) {
            return existingButton;
        }
 
        const button = document.createElement('button');
        button.id = BUTTON_ID;
        button.textContent = BUTTON_TEXT;
        button.type = 'button';
 
        button.style.position = 'absolute';
        button.style.top = '50%';
        button.style.right = '25px'; // Gap from the right edge of the wrapper
        button.style.transform = 'translateY(-50%)';
        button.style.zIndex = '10';
        button.style.padding = '2px 8px';
        button.style.fontSize = '12px';
        button.style.height = 'calc(100% - 8px)'; // Fit nicely, allowing 4px top/bottom margin in wrapper
        button.style.maxHeight = '26px'; // Max height
        button.style.lineHeight = '1';
        button.style.display = 'inline-flex';
        button.style.alignItems = 'center';
        button.style.justifyContent = 'center';
        button.style.border = '1px solid var(--color-btn-border, #606771)';
        button.style.borderRadius = '4px';
        button.style.backgroundColor = 'var(--color-btn-bg, #f6f8fa)';
        button.style.color = 'var(--color-btn-text, #24292f)';
        button.style.cursor = 'pointer';
        button.style.fontWeight = '500';
        button.style.whiteSpace = 'nowrap'; // Prevent text wrapping in button
 
        button.addEventListener('mouseenter', () => {
            button.style.backgroundColor = 'var(--color-btn-hover-bg, #f3f4f6)';
            button.style.borderColor = 'var(--color-btn-hover-border, #505761)';
        });
        button.addEventListener('mouseleave', () => {
            button.style.backgroundColor = 'var(--color-btn-bg, #f6f8fa)';
            button.style.borderColor = 'var(--color-btn-border, #606771)';
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
                const valueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set ||
                                    Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
                if (valueSetter) {
                    valueSetter.call(filterInput, newValue);
                } else {
                    filterInput.value = newValue;
                }
                const inputEvent = new Event('input', { bubbles: true, cancelable: true });
                filterInput.dispatchEvent(inputEvent);
                filterInput.focus();
            }
        });
        return button;
    }
 
    function adjustLayout() {
        if (!filterInput || !inputWrapper || !formatButton) return;
 
        // Ensure input fills the wrapper and has box-sizing: border-box
        filterInput.style.width = '100%';
        filterInput.style.boxSizing = 'border-box';
 
        // Temporarily show button to measure its width if it was hidden
        const wasButtonHidden = formatButton.style.display === 'none';
        if (wasButtonHidden) {
            formatButton.style.visibility = 'hidden'; // Keep it hidden but allow measurement
            formatButton.style.display = 'inline-flex';
        }
 
        const buttonActualWidth = formatButton.offsetWidth;
 
        if (wasButtonHidden) { // Restore original hidden state if needed
            formatButton.style.display = 'none';
            formatButton.style.visibility = 'visible';
        }
 
        const wrapperInnerWidth = inputWrapper.clientWidth -
                                 (parseFloat(getComputedStyle(inputWrapper).paddingLeft) || 0) -
                                 (parseFloat(getComputedStyle(inputWrapper).paddingRight) || 0);
 
        const spaceForButtonAndGap = buttonActualWidth + 10; // 5px on each side of button within input padding
 
        // Check if there's enough space for the button AND a minimum text area
        if (buttonActualWidth > 0 && (wrapperInnerWidth - spaceForButtonAndGap) >= MIN_INPUT_TEXT_AREA_WIDTH) {
            filterInput.style.paddingRight = `${spaceForButtonAndGap}px`;
            formatButton.style.display = 'inline-flex'; // Show button
        } else {
            // Not enough space, hide button and reset padding
            filterInput.style.paddingRight = '8px'; // Or original padding if you stored it
            formatButton.style.display = 'none';    // Hide button
        }
    }
 
 
    function setupInputAndButton() {
        const currentDomInput = document.getElementById(INPUT_ID);
 
        if (!currentDomInput) { // Input disappeared, cleanup
            if (resizeObserver && inputWrapper) {
                resizeObserver.unobserve(inputWrapper);
            }
            if (formatButton && formatButton.parentNode) formatButton.parentNode.removeChild(formatButton);
            if (inputWrapper && inputWrapper.parentNode && inputWrapper.classList.contains(WRAPPER_CLASS)) {
                const originalParent = inputWrapper.parentNode;
                if (filterInput && document.body.contains(filterInput) && filterInput.parentElement !== originalParent) {
                    originalParent.insertBefore(filterInput, inputWrapper); // Restore original input
                    filterInput.style.paddingRight = ''; // Reset padding
                    filterInput.style.width = '';      // Reset width
                }
                originalParent.removeChild(inputWrapper);
            }
            filterInput = null; inputWrapper = null; formatButton = null;
            return;
        }
 
        filterInput = currentDomInput;
 
        if (filterInput.parentElement && filterInput.parentElement.classList.contains(WRAPPER_CLASS)) {
            inputWrapper = filterInput.parentElement;
        } else {
            inputWrapper = document.createElement('div');
            inputWrapper.classList.add(WRAPPER_CLASS);
            inputWrapper.style.position = 'relative'; // For absolute positioned button
 
            // Mimic original input's display and allow it to take available space
            const originalInputComputedStyle = getComputedStyle(filterInput);
            inputWrapper.style.display = originalInputComputedStyle.display;
            // If the input was block or flex, it likely took full width of its context
            if (originalInputComputedStyle.display === 'block' || originalInputComputedStyle.display === 'flex') {
                 inputWrapper.style.width = '100%'; // Or copy originalInputComputedStyle.width if it was specific
            } else if (originalInputComputedStyle.display === 'inline-block') {
                // For inline-block, width might be content-based or explicitly set.
                // We let it be content-based unless original input had a specific width.
                if (originalInputComputedStyle.width !== 'auto' && !originalInputComputedStyle.width.includes('%')) {
                    inputWrapper.style.width = originalInputComputedStyle.width;
                }
            }
            // Handle case where input might be directly in a flex container
            if (filterInput.parentElement && getComputedStyle(filterInput.parentElement).display.includes('flex')) {
                inputWrapper.style.flexGrow = originalInputComputedStyle.flexGrow;
                inputWrapper.style.flexShrink = originalInputComputedStyle.flexShrink;
                inputWrapper.style.flexBasis = originalInputComputedStyle.flexBasis;
            }
 
 
            if (filterInput.parentNode) {
                filterInput.parentNode.insertBefore(inputWrapper, filterInput);
                inputWrapper.appendChild(filterInput);
            } else {
                console.warn("[Tampermonkey] Filter input has no parent, cannot wrap.");
                return;
            }
        }
 
        if (!formatButton || !inputWrapper.contains(formatButton)) {
            formatButton = createFormatButton();
            inputWrapper.appendChild(formatButton);
        }
 
        // Initial layout adjustment
        adjustLayout();
 
        // Observe wrapper for size changes to re-adjust layout
        if (typeof ResizeObserver !== 'undefined') {
            if (resizeObserver) { // Disconnect from old wrapper if any
                resizeObserver.disconnect();
            }
            resizeObserver = new ResizeObserver(entries => {
                // We are observing the wrapper, so direct call to adjustLayout
                requestAnimationFrame(adjustLayout); // Debounce with requestAnimationFrame
            });
            if (inputWrapper) {
                resizeObserver.observe(inputWrapper);
            }
        } else {
            // Fallback for browsers without ResizeObserver (less ideal)
            // window.addEventListener('resize', adjustLayout); // This is too broad
            // console.warn("[Tampermonkey] ResizeObserver not supported. Layout might not be perfectly responsive to container changes.");
        }
    }
 
    const mutationObserver = new MutationObserver(() => {
        const currentInput = document.getElementById(INPUT_ID);
        if (currentInput) {
            if (!inputWrapper || !inputWrapper.contains(currentInput) || !formatButton || !inputWrapper.contains(formatButton)) {
                setupInputAndButton();
            }
        } else if (filterInput) { // Input was there but now it's gone
            setupInputAndButton(); // This will trigger the cleanup logic
        }
    });
 
    mutationObserver.observe(document.body, { childList: true, subtree: true });
 
    setTimeout(setupInputAndButton, 1000);
 
})();