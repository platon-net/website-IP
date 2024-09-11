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
		//websiteip.className = 'chrome_websiteIP_right';
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

		/*
		websiteip.addEventListener('mouseover', function() {
			if(this.className.indexOf('chrome_websiteIP_right') !== -1) {
				this.className = this.className.replace('chrome_websiteIP_right', 'chrome_websiteIP_left');
			} else {
				this.className = this.className.replace('chrome_websiteIP_left', 'chrome_websiteIP_right');
			}
		}, false);
		*/
		dragElement(websiteip);
	});
});

function dragElement(elmnt) {
	var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
	elmnt.onmousedown = dragMouseDown;

	function dragMouseDown(e) {
		e = e || window.event;
		e.preventDefault();
		// Získaj pozíciu kurzora na začiatku
		pos3 = e.clientX;
		pos4 = e.clientY;
		document.onmouseup = closeDragElement;
		document.onmousemove = elementDrag;
	}

	function elementDrag(e) {
		e = e || window.event;
		e.preventDefault();
		// Vypočítaj novú pozíciu kurzora
		pos1 = pos3 - e.clientX;
		pos2 = pos4 - e.clientY;
		pos3 = e.clientX;
		pos4 = e.clientY;
		// Nastav novú pozíciu elementu
		elmnt.style.top = (Math.max(elmnt.offsetTop - pos2, 0)) + "px";
		elmnt.style.left = (Math.max(elmnt.offsetLeft - pos1, 0)) + "px";
	}

	function closeDragElement() {
		// Zastav posúvanie, keď sa uvoľní tlačidlo myši
		document.onmouseup = null;
		document.onmousemove = null;
	}
}