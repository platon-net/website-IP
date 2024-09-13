// Extract domain name (DN) from URL
function url2dn(url) {
	var tmpa = document.createElement('a');
	tmpa.href = url;
	return tmpa.host;
}

// get IP using webRequest
var currentIPList = {};
browser.webRequest.onCompleted.addListener(
	function(info) {
		// summary:
		//		retieve IP
		currentIPList[url2dn(info.url)] = info.ip;
	}, {
		"urls": ["http://*/*", "https://*/*"]
	}
);

// Listeners
browser.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
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
				ip: currentIPList[url2dn(sender.tab.url)] || null
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
		default:
			sendResponse({});
		}
	}
);