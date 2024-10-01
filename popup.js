
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
	document.getElementById('label-message-info').classList.remove('hide');
});

document.querySelector('#copyToClipboard').addEventListener('click', function() {
	// content script
	/*
	browser.runtime.sendMessage({
		name: 'copyIP'
	});
	*/
	var ip_address = document.getElementById('ip-address').innerHTML;
	clipboardSet(ip_address);
	document.getElementById('label-message-clipboardCopied').classList.remove('hide');
	setTimeout(function(){
		document.getElementById('label-message-clipboardCopied').classList.add('hide');
	}, 3000);
});

function clipboardSet(value) {
	if (document.getElementById('copy-to-clipboard') == null) {
		// $('body').append('<textarea type="text" style="position: absolute; top: -1000px; left: -1000px;" id="copy-to-clipboard"></textarea>');
		var textarea = document.createElement('textarea');
		textarea.type = 'text';
		textarea.style.position = 'absolute';
		textarea.style.top = '-1000px';
		textarea.style.left = '-1000px';
		textarea.id = 'copy-to-clipboard';
		document.body.appendChild(textarea);
	}
	var copyText = document.getElementById('copy-to-clipboard');
	copyText.innerHTML = value;
	copyText.select();
	copyText.setSelectionRange(0, 99999); /*For mobile devices*/
	document.execCommand("copy");
	copyText.remove();
}

updateButtonStatus();

function updateIPaddress() {
	browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
		let currentTab = tabs[0]; // Prvý (a jediný) aktívny tab v aktuálnom okne
		// console.log(currentTab);

		browser.runtime.sendMessage({name: 'getIPbyURL', url: currentTab.url}, function(response) {
			// console.log(response);
			var response_ip = 'N/A';
			if(response && response.ip && response.ip != null && response.ip != undefined) {
				response_ip = response.ip;
			}
			document.getElementById('ip-address').innerHTML = response_ip;
			if (response_ip != 'N/A') {
				updateIPflag(response_ip);
			}
		});

	  }).catch((error) => {
		console.error(`Error: ${error}`);
	  });
}

updateIPaddress();

function updateIPflag(ip_address) {
	browser.runtime.sendMessage({name: 'geoIP', ip_address: ip_address}, function(response) {
		document.getElementById('ip-country').innerHTML = response.data.name;
		var img_flag = document.createElement('img');
		img_flag.classList.add('ip-country-flag');
		img_flag.title = response.data.name;
		img_flag.alt = response.data.name;
		img_flag.src = browser.runtime.getURL('images/flags/'+response.data.iso_code+'.png');
		document.getElementById('ip-country-flag').appendChild(img_flag);
	});
}
