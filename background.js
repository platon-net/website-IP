import { Reader } from './node_modules/libmaxmind/index.mjs';
import API from './lib/openapi-js-simple/src/API.js';

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

function geoIPmaxmind(ip_address, callback) {
	// console.log('geoIPmaxmind = '+ip_address);
	fetch(browser.runtime.getURL('MaxMind/GeoLite2-Country.mmdb'))
		.then(response => response.arrayBuffer())
		.then(arrayBuffer => {
			var reader = new Reader(arrayBuffer);
			var result = reader.get(ip_address);
			if (callback != null) callback({
				'iso_code': result.country.iso_code,
				'name': result.country.names.en
			});
		})
		.catch(error => console.error('Error loading MMDB:', error));
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
		if (response.status == 'OK' && response.data != null) {
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

// Listeners
browser.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		//console.log(request);
		switch(request.name) {
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
			sendResponse({
				ip: getIPfromURL(sender.tab.url),
				is_webservice_enabled: isRemoteServiceEnabled()
			});
			break;
		case 'getIPbyURL':
			sendResponse({
				ip: getIPfromURL(request.url)
			});
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
				geoIPapi(request.ip_address, function(result){
					sendResponse({ip_address: request.ip_address, source: 'openapi', data: result});
				});
			} else {
				geoIPmaxmind(request.ip_address, function(result){
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
