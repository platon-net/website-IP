const URL_SHORTENER_KEY = 'url_shortener_endpoint_url';
const DEFAULT_URL_SHORTENER = 'https://ix.sk/?action=create&format=json&longurl=';

export function getShortenerEndpoint() {
	return (localStorage.getItem(URL_SHORTENER_KEY) ?? DEFAULT_URL_SHORTENER).trim();
}

export function saveShortenerEndpoint(value) {
	localStorage.setItem(URL_SHORTENER_KEY, value);
}

export function parseHttpUrl(value) {
	if (typeof value !== 'string') return null;
	try {
		const url = new URL(value);
		return url.protocol === 'http:' || url.protocol === 'https:' ? url : null;
	} catch {
		return null;
	}
}

export function getShortenerPermission(endpoint) {
	const url = parseHttpUrl(endpoint);
	if (!url || url.username || url.password || endpoint.includes('#')) return null;
	const probe = parseHttpUrl(endpoint + encodeURIComponent('https://example.com/'));
	if (probe?.origin !== url.origin) return null;
	return {origins: [url.protocol + '//' + url.hostname + '/*']};
}
