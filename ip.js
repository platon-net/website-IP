// document.addEventListener('DOMContentLoaded', function() {
// 	console.log('DOMContentLoaded');
// 	loadIPaddressOnlyEnabled();
// });

var websiteIPboxEnabled = true;
loadIPaddressOnlyEnabled();

function loadIPaddressOnlyEnabled() {
	// console.log('loadIPaddressOnlyEnabled');

	browser.runtime.sendMessage({name: 'isEnabledForTab'}, function(response) {
		if(!response.status) {
			websiteIPboxEnabled = false;
			// console.log('disabled websiteIP');
			return;
		}
		loadIPaddress();
		setInterval(checkBox, 10000);
	});
}

function closeBox() {
	var websiteip = document.getElementById('box_websiteIP');
	if (websiteip!= null) {
		websiteip.parentNode.removeChild(websiteip);
	}
}

function checkBox() {
	if (!websiteIPboxEnabled) return true;
	var websiteip = document.getElementById('box_websiteIP');
	if (websiteip != null) return true;
	loadIPaddress();
}

var loadIPaddress_try_again = 3;
function loadIPaddress() {
	browser.runtime.sendMessage({name: 'getIP'}, function(response) {
		// summary:
		//		grab the ip

		// console.log(response);
		var response_ip = 'N/A';
		if(response && response.ip && response.ip != null && response.ip != undefined) {
			response_ip = response.ip;
		}


		var websiteip = document.getElementById('box_websiteIP');
		if (websiteip == null) {
			websiteip = document.createElement('div');
			websiteip.id = 'box_websiteIP';
			//websiteip.src = chrome.runtime.getURL('content/index.html');
			//websiteip.className = 'box_websiteIP_right';
			if(document && document.body) {
				document.body.appendChild(websiteip);
			}
		}

		websiteip.innerHTML = '<span class="websiteip-ip">'+response_ip+'</span>';

		/*
		websiteip.addEventListener('mouseover', function() {
			if(this.className.indexOf('box_websiteIP_right') !== -1) {
				this.className = this.className.replace('box_websiteIP_right', 'box_websiteIP_left');
			} else {
				this.className = this.className.replace('box_websiteIP_left', 'box_websiteIP_right');
			}
		}, false);
		*/
		dragElement(websiteip, true);
		refreshLastPosition();

		if (response_ip == 'N/A') {
			if (loadIPaddress_try_again-- > 0) {
				websiteip.innerHTML += ' - try again '+loadIPaddress_try_again.toString();
				setTimeout(loadIPaddress, 3000);
			} else {
				websiteip.innerHTML += ' - FAILED';
			}
		} else {
			geoIP(response_ip, function(response){
				var flag = document.createElement('img');
				flag.height = 20;
				flag.alt = response.data.name;
				flag.title = response.data.name;
				flag.src = browser.runtime.getURL('images/flags/'+response.data.iso_code+'.png');
				flag.classList.add('websiteip-flag');
				// websiteip.appendChild(flag);
				websiteip.insertBefore(flag, websiteip.firstChild);
			});
		}

		if (response.is_webservice_enabled) {
			var addinfo = document.createElement('span');
			addinfo.classList.add('websiteip-icon');
			addinfo.innerHTML = '<img src="'+browser.runtime.getURL('images/icon-info2.svg')+'" title="Additional info" width="20" height="20">';
			addinfo.addEventListener('click', websiteipAdditionalInfo);
			websiteip.appendChild(addinfo);
		}

		var closeButton = document.createElement('span');
		closeButton.classList.add('websiteip-icon');
		closeButton.classList.add('on-hover');
		closeButton.innerHTML = '<img src="'+browser.runtime.getURL('images/icon-close.svg')+'" title="Close for this tab" width="20" height="20">';
		closeButton.addEventListener('click', closeForTab);
		websiteip.appendChild(closeButton);

	});
}

function dragElement(elmnt, savepostion) {
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
		new_top = Math.min(new_top, window.innerHeight - elmnt.offsetHeight - 10);
		new_left = Math.min(new_left, window.innerWidth - elmnt.offsetWidth - 10);
		elmnt.style.top = new_top + "px";
		elmnt.style.left = new_left + "px";
		if (savepostion) {
			localStorage.setItem('website_position_top', new_top);
			localStorage.setItem('website_position_left', new_left);
			browser.runtime.sendMessage({name: 'setLastPosition', position: {top: new_top, left: new_left}});
		}
	}

	function closeDragElement() {
		// Zastav posúvanie, keď sa uvoľní tlačidlo myši
		document.onmouseup = null;
		document.onmousemove = null;
	}
}

document.addEventListener('visibilitychange', function() {
	if (document.visibilityState === 'visible') {
		refreshLastPosition();
	}
});

function refreshLastPosition() {
	browser.runtime.sendMessage({name: 'getLastPosition'}, function(response){
		if (response == null || response.position == null) return false;
		var websiteip = document.getElementById('box_websiteIP');
		if (websiteip == null) return false;
		var last_top = response.position.top;
		var last_left = response.position.left;
		if (last_top != null && last_left != null) {
			last_top = Math.min(last_top, window.innerHeight - websiteip.offsetHeight - 10);
			last_left = Math.min(last_left, window.innerWidth - websiteip.offsetWidth - 10);
			websiteip.style.top = last_top + "px";
			websiteip.style.left = last_left + "px";
		}
	});
}

function geoIP(ip_address, callback) {
	// console.log('geoIP', ip_address);
	browser.runtime.sendMessage({name: 'geoIP', ip_address: ip_address}, function(response) {
		console.log('pre IP = ', ip_address, 'odpoved geoIP = ', response);
		if (callback != null) callback(response);
	});
}

function websiteipAdditionalInfo() {
	var domain = location.hostname;
	var addinfo = document.getElementById('box_websiteIP_addinfo');
	if (addinfo == null) {
		addinfo = document.createElement('div');
		addinfo.id = 'box_websiteIP_addinfo';
		if(document && document.body) {
			document.body.appendChild(addinfo);
		}
	}
	var websiteip_icon = '<img src="'+browser.runtime.getURL('images/icon48.png')+'" alt="" width="20" height="20" style="top: 5px; position: relative; margin-right: 5px; float:left;">';
	addinfo.innerHTML = '<div id="websiteip-addinfo-control">'
		+ '<div>'+websiteip_icon+'WebsiteIP &mdash; Additional Domain Info</div>'
		+ '<img src="'+browser.runtime.getURL('images/icon-close.svg')+'" alt="Close" title="Close" width="20" height="20" id="websiteip-addinfo-close">'
		+ '</div>'
		+ '<div id="websiteip-addinfo-content">Loading...</div>';

	document.getElementById('websiteip-addinfo-close').addEventListener('click', function(){
		document.getElementById('box_websiteIP_addinfo').remove();
	});

	dragElement(addinfo, false);

	browser.runtime.sendMessage({name: 'addinfo', domain: domain}, function(response) {
		document.getElementById('websiteip-addinfo-content').innerHTML = response.data.html;
	});
}

function closeForTab() {
	browser.runtime.sendMessage({name: 'setEnabledForTab', 'status': false}, function(response) {
		// console.log(response);
		if (response.tab_status == 'false') {
			closeBox();
			websiteIPboxEnabled = false;
		}
	});
}
