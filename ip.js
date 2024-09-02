browser.runtime.sendMessage({name: 'isEnabled'}, function(isEnabled) {
	// summary:
	//		only do stuff if enabled
	if(!isEnabled) { return; }

	browser.runtime.sendMessage({name: 'getIP'}, function(response) {
		// summary:
		//		grab the ip

		console.log(response);
		if(!response || !response.ip || response.ip === '::') { return; }

		var websiteip = document.createElement('websiteip');

		websiteip.id = 'chrome_websiteIP';
		websiteip.className = 'chrome_websiteIP_right';
		var response_ip = response.ip;
		if (response_ip == null
			|| response_ip == undefined)
		{
			response_ip = 'N/A'
		}
		websiteip.innerHTML = response.ip;
		if(document && document.body) {
			document.body.appendChild(websiteip);
		}

		websiteip.addEventListener('mouseover', function() {
			if(this.className.indexOf('chrome_websiteIP_right') !== -1) {
				this.className = this.className.replace('chrome_websiteIP_right', 'chrome_websiteIP_left');
			} else {
				this.className = this.className.replace('chrome_websiteIP_left', 'chrome_websiteIP_right');
			}
		}, false);
	});
});