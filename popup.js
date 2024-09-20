
function updateButtonStatus() {
	browser.runtime.sendMessage({name: 'isEnabled'}, function(isEnabled) {
		// summary:
		//		set the button to the correct value

		//reverse because the value represent the opposite of current
		var button = document.querySelector('#enableDisableIPButton');
		if (button) {
			document.querySelector('#enableDisableIPButton').value = isEnabled ? 'false' : 'true';
			var button_html = browser.i18n.getMessage(isEnabled ? 'disable' : 'enable');
			document.querySelector('#enableDisableIPButton').innerHTML = button_html;
		}
	});
}

document.querySelector('#enableDisableIPButton').addEventListener('click', function() {
	// summary:
	//		Attach the click event

	if(document.querySelector('#enableDisableIPButton').value === 'false') {
		browser.runtime.sendMessage({name: 'setEnabled', status: false}, updateButtonStatus);
	} else {
		browser.runtime.sendMessage({name: 'setEnabled', status: true}, updateButtonStatus);
	}
});

document.querySelector('#copyToClipboard').addEventListener('click', function() {
	// content script
	browser.runtime.sendMessage({
		name: 'copyIP'
	});
});

updateButtonStatus();

function updateIPaddress() {
	browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
		let currentTab = tabs[0]; // Prvý (a jediný) aktívny tab v aktuálnom okne
		console.log(currentTab);

		browser.runtime.sendMessage({name: 'getIPbyURL', url: currentTab.url}, function(response) {
			console.log(response);
			var response_ip = 'N/A';
			if(response && response.ip && response.ip != null && response.ip != undefined) {
				response_ip = response.ip;
			}
			document.getElementById('ip-address').innerHTML = response_ip;
		});

	  }).catch((error) => {
		console.error(`Error: ${error}`);
	  });
}

updateIPaddress();
