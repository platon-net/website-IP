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
		websiteip.innerHTML = response_ip;
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
		refrestLastPosition();
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
		var new_top = Math.max(elmnt.offsetTop - pos2, 0);
		var new_left = Math.max(elmnt.offsetLeft - pos1, 0);
		elmnt.style.top = new_top + "px";
		elmnt.style.left = new_left + "px";
		localStorage.setItem('website_position_top', new_top);
		localStorage.setItem('website_position_left', new_left);
		browser.runtime.sendMessage({name: 'setLastPosition', position: {top: new_top, left: new_left}});
	}

	function closeDragElement() {
		// Zastav posúvanie, keď sa uvoľní tlačidlo myši
		document.onmouseup = null;
		document.onmousemove = null;
	}
}

document.addEventListener('visibilitychange', function() {
	if (document.visibilityState === 'visible') {
		refrestLastPosition();
	}
});

function refrestLastPosition() {
	browser.runtime.sendMessage({name: 'getLastPosition'}, function(response){
		if (response.position == null) return false;
		var websiteip = document.getElementById('chrome_websiteIP');
		var last_top = response.position.top;
		var last_left = response.position.left;
		if (last_top != null && last_left != null) {
			websiteip.style.top = last_top + "px";
			websiteip.style.left = last_left + "px";
		}
	});
}
