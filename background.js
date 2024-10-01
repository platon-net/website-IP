import { Reader } from './node_modules/libmaxmind/index.mjs';

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
		case 'getIP':
			sendResponse({
				ip: getIPfromURL(sender.tab.url)
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
			geoIPmaxmind(request.ip_address, function(result){
				sendResponse({ip_address: request.ip_address, format: 'maxmind', data: result});
			});
			break;
		default:
			sendResponse({});
		}
		return true;
	}
);