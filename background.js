import { Reader } from './node_modules/libmaxmind/index.mjs';
import API from './lib/openapi-js-simple/src/API.js';
import { getShortenerEndpoint, getShortenerPermission, parseHttpUrl } from './url-shortener.mjs';

// Extract domain name (DN) from URL
function url2dn(url) {
	var tmpa = document.createElement('a');
	tmpa.href = url;
	return tmpa.host;
}

function url2basic(url) {
	var tmpa = document.createElement('a');
	tmpa.href = url;
	return tmpa.protocol + '//' + tmpa.host;
}

// get IP using webRequest
var currentIPList = {};
browser.webRequest.onCompleted.addListener(
	function(info) {
		// summary:
		//		retieve IP
		currentIPList[url2dn(info.url)] = info.ip;
		// console.log('webrequst oncompleted', info);

	}, {
		"urls": ["http://*/*", "https://*/*"]
	}
);

// use in case ip is not resolved by top_frame request
const xDNS = href => new Promise((resolve, reject) => {
	// console.log('xDNS = ' + href);
	if (!href.startsWith('http')) return false;

	const {origin} = new URL(href);

	const controller = new AbortController();
	const signal = controller.signal;
	const done = (d, e) => {
	  controller.abort();
	  clearTimeout(id);
	  chrome.webRequest.onResponseStarted.removeListener(init);
	  if (e) {
		reject(e);
	  }
	  else {
		resolve(d);
	  }
	};
	const init = d => done(d);
	const id = setTimeout(() => done(null, Error('timeout')), 5000);
	chrome.webRequest.onResponseStarted.addListener(init, {
	  urls: [origin + '/*'],
	  types: ['xmlhttprequest']
	}, []);

	fetch(href, {
	  cache: 'no-cache',
	  mode: 'cors',
	  signal
	}).then(r => r.text()).catch(e => done(null, e));
});

function XHRGET(url) {
	// console.log('XHRGET = ' + url);
	var xhr = new XMLHttpRequest();
	xhr.open('GET', url, true);
	// Nastavenie hlavičiek na zakázanie cache
	xhr.setRequestHeader('Cache-Control', 'no-cache, no-store, max-age=0');
	xhr.setRequestHeader('Pragma', 'no-cache');
	xhr.setRequestHeader('Expires', 'Thu, 01 Jan 1970 00:00:00 GMT');
	xhr.onreadystatechange = function () {
	if (xhr.readyState === 4 && xhr.status === 200) {
		// console.log('Data:', xhr.responseText);
	}
	};
	xhr.send();
}

function getIPfromURL(url) {
	// console.log(currentIPList);
	var ip = currentIPList[url2dn(url)] || null;
	if (ip != null) return ip;
	var url_basic = url2basic(url);
	xDNS(url_basic);
	XHRGET(url_basic);
	return null;
}

const UNKNOWN_COUNTRY = {iso_code: 'N/A', name: 'N/A'};

async function geoIPmaxmind(ip_address) {
	try {
		const response = await fetch(browser.runtime.getURL('MaxMind/GeoLite2-Country.mmdb'));
		if (!response.ok) throw new Error('HTTP ' + response.status);
		const reader = new Reader(await response.arrayBuffer());
		const country = reader.get(ip_address)?.country;
		if (country?.iso_code && country.names?.en) {
			return {iso_code: country.iso_code, name: country.names.en};
		}
	} catch (error) {
		console.error('Error loading MMDB:', error);
	}
	return UNKNOWN_COUNTRY;
}

function isWebserviceEnabled() {
	return webserviceEndpoint().length > 0;
}

function webserviceEndpoint() {
	var url = localStorage.getItem('webservice_endpoint_url');
	if (url == null || url == undefined) return '';
	return url.trim();
}

function isAPIenabled() {
	return apiEndpoint().length > 0;
}

function apiEndpoint() {
	var url = localStorage.getItem('api_endpoint_url');
	if (url == null || url == undefined) return '';
	return url.trim();
}

function apiToken() {
	var token = localStorage.getItem('api_token');
	if (token == null || token == undefined) return null;
	token = token.trim();
	return token.length > 0 ? token : null;
}

function apiClient() {
	return new API(apiEndpoint(), apiToken());
}

function remoteService() {
	var service = localStorage.getItem('remote_service');
	if (service == null || service == undefined) {
		return isWebserviceEnabled() ? 'webservice' : 'none';
	}
	service = service.toLowerCase();
	return ['none', 'webservice', 'openapi'].includes(service) ? service : 'none';
}

function isRemoteServiceEnabled() {
	var service = remoteService();
	return (service == 'webservice' && isWebserviceEnabled())
		|| (service == 'openapi' && isAPIenabled());
}

const IGNORED_IPS_STORAGE_KEY = 'ignored_ips';

function normalizeIgnoredValue(value) {
	return typeof value == 'string' ? value.trim().toLowerCase() : '';
}

function loadIgnoredValues(storage_key) {
	var stored_values = localStorage.getItem(storage_key);
	if (stored_values == null) return [];
	try {
		var values = JSON.parse(stored_values);
		if (!Array.isArray(values)) return [];
		return [...new Set(values.map(normalizeIgnoredValue).filter(value => value.length > 0))];
	} catch (error) {
		console.error(error);
		return [];
	}
}

function saveIgnoredValues(storage_key, values) {
	var normalized_values = [...new Set(values.map(normalizeIgnoredValue).filter(value => value.length > 0))];
	localStorage.setItem(storage_key, JSON.stringify(normalized_values));
	return normalized_values;
}

function loadIgnoredIPs() {
	return loadIgnoredValues(IGNORED_IPS_STORAGE_KEY);
}

function saveIgnoredIPs(ip_addresses) {
	return saveIgnoredValues(IGNORED_IPS_STORAGE_KEY, ip_addresses);
}

function addIgnoredIP(ip_address) {
	var ip_addresses = loadIgnoredIPs();
	ip_addresses.push(ip_address);
	return saveIgnoredIPs(ip_addresses);
}

function removeIgnoredIP(ip_address) {
	var normalized_ip_address = normalizeIgnoredValue(ip_address);
	return saveIgnoredIPs(loadIgnoredIPs().filter(value => value != normalized_ip_address));
}

function isIgnoredIP(ip_address) {
	return loadIgnoredIPs().includes(normalizeIgnoredValue(ip_address));
}

function webservice(service, params, callback) {
	var webservice_endpoint_url = webserviceEndpoint()+'?ws='+service;
	var form_data  = new FormData();
	Object.keys(params).forEach(key => {
		form_data.append(key, params[key]);
	});
	return fetch(webservice_endpoint_url, {
		method: 'POST',
		// headers: { 'Content-Type': 'application/json' },
		// body: JSON.stringify(params)
		body: form_data
	})
	.then(response => response.json())
	.then(json => {
		if (callback != null) return callback(json);
		return json;
	});
}

function geoIPwebservice(ip_address, callback) {
	return webservice('geoip', {ip_address: ip_address}, function(response){
		var result = {};
		if (response.status == 'OK') {
			result = {
				'iso_code': response.data.iso_code,
				'name': response.data.name
			};
		} else {
			console.error(response.msg);
			result = {'iso_code': 'N/A', 'name': 'N/A'};
		}
		if (callback != null) callback(result);
		return result;
	})
	.catch(error => {
		console.error(error);
		var result = {'iso_code': 'N/A', 'name': 'N/A'};
		if (callback != null) callback(result);
		return result;
	});
}

function addInfoWebservice(domain, callback) {
	return webservice('domain_additional_info', {domain: domain}, function(response){
		var result = {};
		if (response.status == 'OK') {
			result = {
				'html': response.data.html
			};
		} else {
			console.error(response.msg);
			result = {'html': response.msg};
		}
		if (callback != null) callback(result);
		return result;
	})
	.catch(error => {
		console.error(error);
		var result = {'html': browser.i18n.getMessage('remoteServiceError')};
		if (callback != null) callback(result);
		return result;
	});
}

function geoIPapi(ip_address, callback) {
	return Promise.resolve()
	.then(() => apiClient().get('/ip/'+encodeURIComponent(ip_address)+'/geo'))
	.then(response => {
		var result = {};
		if (response?.msg === 'Country is not detected') {
			return geoIPmaxmind(ip_address).then(country => {
				if (callback != null) callback(country, 'local');
				return country;
			});
		}
		if (response?.status == 'OK' && response.data != null) {
			result = {
				'iso_code': response.data.iso_code,
				'name': response.data.name
			};
		} else {
			console.error(response?.msg || 'Invalid GeoIP response');
			result = UNKNOWN_COUNTRY;
		}
		if (callback != null) callback(result);
		return result;
	})
	.catch(error => {
		console.error(error);
		var result = {'iso_code': 'N/A', 'name': 'N/A'};
		if (callback != null) callback(result);
		return result;
	});
}

function addInfoAPI(domain, callback) {
	return Promise.resolve()
	.then(() => apiClient().get('/domains/'+encodeURIComponent(domain)+'/additional-info'))
	.then(response => {
		var result = {};
		if (response.status == 'OK' && response.data != null) {
			result = {
				'html': response.data.html
			};
		} else {
			console.error(response.msg);
			result = {'html': response.msg};
		}
		if (callback != null) callback(result);
		return result;
	})
	.catch(error => {
		console.error(error);
		var result = {'html': browser.i18n.getMessage('remoteServiceError')};
		if (callback != null) callback(result);
		return result;
	});
}

function shorteningError(message) {
	return {success: false, error: browser.i18n.getMessage(message)};
}

async function shortenUrl(url) {
	if (!parseHttpUrl(url)) return shorteningError('shortenerInvalidPage');

	const apiUrl = getShortenerEndpoint();
	if (!apiUrl) return shorteningError('shortenerDisabled');

	const requestUrl = apiUrl + encodeURIComponent(url);
	const permission = getShortenerPermission(apiUrl);
	if (!permission) return shorteningError('shortenerInvalidEndpoint');

	try {
		if (!await browser.permissions.contains(permission)) {
			return shorteningError('shortenerPermission');
		}
	} catch {
		return shorteningError('shortenerPermission');
	}

	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 10000);
	try {
		const response = await fetch(requestUrl, {
			method: 'GET',
			signal: controller.signal,
			credentials: 'omit',
			redirect: 'error',
			referrerPolicy: 'no-referrer',
			cache: 'no-store'
		});
		if (!response.ok) return shorteningError('shortenerHttpError');

		const result = await response.json();
		if (result?.status !== 'OK' || !parseHttpUrl(result.shorturl)) {
			return shorteningError('shortenerInvalidResponse');
		}
		return {success: true, shorturl: result.shorturl.trim()};
	} catch (error) {
		if (controller.signal.aborted) return shorteningError('shortenerTimeout');
		if (error instanceof SyntaxError) return shorteningError('shortenerInvalidResponse');
		return shorteningError('shortenerUnavailable');
	} finally {
		clearTimeout(timeout);
	}
}

// Listeners
browser.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		//console.log(request);
		switch(request.name) {
		case 'shortenUrl':
			const pageUrl = parseHttpUrl(sender.url);
			if (!sender.tab || sender.frameId !== 0 || !pageUrl
				|| pageUrl.origin !== parseHttpUrl(request.url)?.origin) {
				return Promise.resolve(shorteningError('shortenerInvalidPage'));
			}
			return shortenUrl(request.url);
		case 'setEnabled':
			// request from the content script to set the options.
			localStorage.setItem('websiteIPEnabled', request.status ? 'true' : 'false');
			break;
		case 'isEnabled':
			// request from the content script to get the options.
			sendResponse(localStorage.getItem('websiteIPEnabled') === 'true' || localStorage.getItem('websiteIPEnabled') === null);
			break;
		case 'isEnabledForTab':
			const general_enabled = localStorage.getItem('websiteIPEnabled') === 'true' || localStorage.getItem('websiteIPEnabled') === null;
			if (!general_enabled) {
				sendResponse({'status': false});
				return;
			}
			browser.tabs.query({ active: true, currentWindow: true }, function (tabs) {
				const activeTab = tabs[0];
				const tab_key = 'window_'+activeTab.windowId+'_tab_'+activeTab.id;
				const tab_enabled = sessionStorage.getItem(tab_key) === 'true' || sessionStorage.getItem(tab_key) === null;
				sendResponse({'tab_key': tab_key, 'status': tab_enabled});
			});
			break;
		case 'setEnabledForTab':
			browser.tabs.query({ active: true, currentWindow: true }, function (tabs) {
				const activeTab = tabs[0];
				const tab_key = 'window_'+activeTab.windowId+'_tab_'+activeTab.id;
				const tab_status = request.status ? 'true' : 'false';
				sessionStorage.setItem(tab_key, tab_status);
				sendResponse({'tab_key': tab_key, 'tab_status': tab_status});
			});
			break;
		case 'getIP':
			var current_ip_address = getIPfromURL(sender.tab.url);
			sendResponse({
				ip: current_ip_address,
				is_ip_ignored: isIgnoredIP(current_ip_address),
				is_webservice_enabled: isRemoteServiceEnabled(),
				is_shortener_enabled: Boolean(getShortenerEndpoint())
			});
			break;
		case 'getIPbyURL':
			var requested_ip_address = getIPfromURL(request.url);
			sendResponse({
				ip: requested_ip_address,
				is_ip_ignored: isIgnoredIP(requested_ip_address)
			});
			break;
		case 'isIPIgnored':
			sendResponse({ip_address: request.ip_address, ignored: isIgnoredIP(request.ip_address)});
			break;
		case 'setIPIgnored':
			if (request.ignored) {
				addIgnoredIP(request.ip_address);
			} else {
				removeIgnoredIP(request.ip_address);
			}
			sendResponse({ip_address: request.ip_address, ignored: isIgnoredIP(request.ip_address)});
			break;
		case 'copyIP':
			/* deprecated by Firefox 2024-09-02 12:35:36 Igor
			browser.tabs.getSelected(null, function(tab) {
			*/
			browser.tabs.query({active: true, currentWindow: true}, function(tabs) {
				var input = document.createElement('input');
				document.body.appendChild(input);
				input.value = currentIPList[url2dn(tab.url)] || browser.i18n.getMessage('notFound');
				input.focus();
				input.select();
				document.execCommand('Copy');
				input.remove();
			});
			break;
		case 'setLastPosition':
			localStorage.setItem('websiteIPlastPositionTop', request.position.top);
			localStorage.setItem('websiteIPlastPositionLeft', request.position.left);
			break;
		case 'getLastPosition':
			sendResponse({
				position: {
					top: localStorage.getItem('websiteIPlastPositionTop'),
					left: localStorage.getItem('websiteIPlastPositionLeft')
				}
			});
			break;
		case 'geoIP':
			if (remoteService() == 'webservice' && isWebserviceEnabled()) {
				geoIPwebservice(request.ip_address, function(result){
					sendResponse({ip_address: request.ip_address, source: 'webservice', data: result});
				});
			} else if (remoteService() == 'openapi' && isAPIenabled()) {
				geoIPapi(request.ip_address, function(result, source = 'openapi'){
					sendResponse({ip_address: request.ip_address, source: source, data: result});
				});
			} else {
				geoIPmaxmind(request.ip_address).then(function(result){
					sendResponse({ip_address: request.ip_address, source: 'maxmind', data: result});
				});
			}
			break;
		case 'addInfo':
		case 'addinfo':
			if (remoteService() == 'webservice' && isWebserviceEnabled()) {
				addInfoWebservice(request.domain, function(result){
					sendResponse({domain: request.domain, source: 'webservice', data: result});
				});
			} else if (remoteService() == 'openapi' && isAPIenabled()) {
				addInfoAPI(request.domain, function(result){
					sendResponse({domain: request.domain, source: 'openapi', data: result});
				});
			} else {
				sendResponse({domain: request.domain, source: 'local', data: {html: browser.i18n.getMessage('remoteServiceDisabled')}});
			}
			break;
		default:
			sendResponse({});
		}
		return true;
	}
);
