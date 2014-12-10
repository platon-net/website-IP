
// Set position to left for these websites
/*var noRight = [
		'www.facebook.com',
		'www.google.com'
	],
	noRightCheck = (',' + noRight.join(',') + ',').indexOf(',' + window.location.host + ','), //Check if on noRight array and set position accordingly
	setPosition = noRightCheck >= 0 ? 'left' : 'right';*/
var setPosition = 'right';

chrome.extension.sendMessage({name: 'getIP'}, function(response) {
	var finalIP = response.domainToIP;
	chrome.extension.sendMessage({name: 'getOptions'}, function(response) {
		var websiteIPStatus = response.enableDisableIP,
			websiteip;
		if(websiteIPStatus === CONSTANTS.DISABLE || websiteIPStatus === undefined) {
			websiteip = document.createElement('websiteip');
			websiteip.id = 'chrome_websiteIP';
			websiteip.className = 'chrome_websiteIP_' + setPosition;
			websiteip.innerHTML = finalIP;
			document && document.body && document.body.appendChild(websiteip);

			websiteip.addEventListener('mouseover', function() {
				if(this.className.indexOf('chrome_websiteIP_right') !== -1) {
					this.className = this.className.replace('chrome_websiteIP_right', 'chrome_websiteIP_left');
				} else {
					this.className = this.className.replace('chrome_websiteIP_left', 'chrome_websiteIP_right');
				}
			}, false);
		}
	});
});

function loadOptions() {
	chrome.extension.sendMessage({name: 'getOptions'}, function(response) {
		var enableDisableIP = response.enableDisableIP;

		// set default as disabled
		if(enableDisableIP === undefined) {
			chrome.extension.sendMessage({name: 'setOptions', status: CONSTANTS.DISABLE}, function() {});
		}
	});
}
loadOptions(); //To set default value on pop-up button
