const INPUT_ID = 'filter-bar-component-input';

export function applyFilter(value: string): void {
    const currentDomInput = document.getElementById(INPUT_ID) as HTMLInputElement | HTMLTextAreaElement | null;
    if (!currentDomInput) return;

    const valueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set ||
        Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
    if (valueSetter) {
        valueSetter.call(currentDomInput, value);
    } else {
        (currentDomInput as HTMLInputElement).value = value;
    }
    const inputEvent = new Event('input', { bubbles: true, cancelable: true });
    currentDomInput.dispatchEvent(inputEvent);
    currentDomInput.focus();
}

export function toFuzzyQuery(raw: string): string {
    const trimmed = raw.trim();
    if (trimmed === '') return trimmed;
    return `title:*${trimmed}*`;
}


