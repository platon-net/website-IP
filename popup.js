chrome.extension.sendMessage({name: 'getOptions'}, function(response) {
	document.getElementById('EnableDisableIP').value = response.enableDisableIP;
});

document.querySelector('input').addEventListener('click', function() {
	if(document.getElementById('EnableDisableIP').value === CONSTANTS.DISABLE) {
		// save to localstore
		chrome.extension.sendMessage({name: 'setOptions', status: CONSTANTS.ENABLE}, function() {});
		document.getElementById('EnableDisableIP').value = CONSTANTS.ENABLE;
	} else if(document.getElementById('EnableDisableIP').value === CONSTANTS.ENABLE) {
		// save to localstore
		chrome.extension.sendMessage({name: 'setOptions', status: CONSTANTS.DISABLE}, function() {});
		document.getElementById('EnableDisableIP').value = CONSTANTS.DISABLE;
	}
});
