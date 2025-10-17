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


// Simple Projects filter query helpers
// Parses queries like: key:value pairs and free text.
// Supports quoted values with spaces: key:"some value".
// We operate conservatively and only edit known keys to avoid clobbering user text.
export type ParsedQuery = {
	// known tokens we manage explicitly
	knownTokens: Record<string, string>;
	// other tokens (unknown key:value) preserved verbatim
	otherTokens: string[];
	// free words not key:value
	freeText: string[];
};

const MANAGED_KEYS = new Set<string>([
	'title',
	'assignee',
	'label',
	'status',
	'iteration',
	'is',
]);

function tokenize(query: string): string[] {
	// Split by spaces but keep quoted substrings intact
	const tokens: string[] = [];
	let current = '';
	let inQuotes = false;
	for (let i = 0; i < query.length; i += 1) {
		const ch = query[i] as string;
		if (ch === '"') {
			inQuotes = !inQuotes;
			current += ch;
			continue;
		}
		if (!inQuotes && /\s/.test(ch)) {
			if (current) tokens.push(current);
			current = '';
			continue;
		}
		current += ch;
	}
	if (current) tokens.push(current);
	return tokens;
}

function unquote(value: string): string {
	if (value.length >= 2 && value.startsWith('"') && value.endsWith('"')) {
		return value.slice(1, -1);
	}
	return value;
}

function quoteIfNeeded(value: string): string {
	if (value === '') return value;
	return /\s/.test(value) || /"/.test(value) ? `"${value.replace(/"/g, '\\"')}"` : value;
}

export function parseFilterQuery(query: string): ParsedQuery {
	const tokens = tokenize(query.trim());
	const knownTokens: Record<string, string> = {};
	const otherTokens: string[] = [];
	const freeText: string[] = [];

	tokens.forEach((token) => {
		const idx = token.indexOf(':');
		if (idx > 0) {
			const key = token.slice(0, idx);
			const value = token.slice(idx + 1);
			if (MANAGED_KEYS.has(key)) {
				knownTokens[key] = unquote(value);
			} else {
				otherTokens.push(token);
			}
		} else {
			freeText.push(token);
		}
	});

	return { knownTokens, otherTokens, freeText };
}

function buildQuery(parts: ParsedQuery): string {
	const seq: string[] = [];
	// Keep order roughly: managed tokens (stable order), other tokens, free text
	for (const key of ['title', 'assignee', 'label', 'status', 'iteration', 'is']) {
		const val = parts.knownTokens[key as keyof typeof parts.knownTokens];
		if (typeof val === 'string' && val !== '') {
			seq.push(`${key}:${quoteIfNeeded(val)}`);
		}
	}
	seq.push(...parts.otherTokens);
	seq.push(...parts.freeText);
	return seq.join(' ').trim();
}

export function setToken(query: string, key: string, value: string | null | undefined): string {
	const parsed = parseFilterQuery(query);
	if (!MANAGED_KEYS.has(key)) {
		// Do not attempt to set unknown keys via this helper
		return query;
	}
	if (value == null || value.trim() === '') {
		delete parsed.knownTokens[key];
		return buildQuery(parsed);
	}
	parsed.knownTokens[key] = value.trim();
	return buildQuery(parsed);
}

export function clearManagedTokens(query: string): string {
	const parsed = parseFilterQuery(query);
	parsed.knownTokens = {};
	return buildQuery(parsed);
}


