import { getShortenerEndpoint, getShortenerPermission, saveShortenerEndpoint } from './url-shortener.mjs';

document.addEventListener('DOMContentLoaded', function() {
	/* ----------------------------------------------------
	 * Initialize
	 */
	var remote_service = localStorage.getItem('remote_service');
	var webservice_endpoint_url = localStorage.getItem('webservice_endpoint_url');
	if (webservice_endpoint_url == null) webservice_endpoint_url = '';
	if (remote_service == null) remote_service = webservice_endpoint_url.trim().length > 0 ? 'webservice' : 'none';
	document.getElementById('remote_service').value = remote_service;
	document.getElementById('webservice_endpoint_url').value = webservice_endpoint_url;

	var api_endpoint_url = localStorage.getItem('api_endpoint_url');
	if (api_endpoint_url == null) api_endpoint_url = '';
	document.getElementById('api_endpoint_url').value = api_endpoint_url;

	var api_token = localStorage.getItem('api_token');
	if (api_token == null) api_token = '';
	document.getElementById('api_token').value = api_token;
	const shortenerInput = document.getElementById('url-shortener-endpoint');
	const shortenerError = document.getElementById('url-shortener-settings-error');
	const saveButton = document.getElementById('websiteip_button_save');
	const saveLabel = document.getElementById('websiteip_label_save');
	let saveTimeout;
	shortenerInput.value = getShortenerEndpoint();

	/* ----------------------------------------------------
	 * Button Save onClick
	 */
	saveButton.addEventListener('click', async function() {
		const endpoint = shortenerInput.value.trim();
		const permission = getShortenerPermission(endpoint);
		shortenerError.textContent = '';
		clearTimeout(saveTimeout);
		saveLabel.classList.add('hide');
		if (endpoint && !permission) {
			shortenerError.textContent = browser.i18n.getMessage('shortenerInvalidEndpoint');
			return;
		}
		if (permission) {
			saveButton.disabled = true;
			shortenerInput.disabled = true;
			let granted;
			try {
				granted = await browser.permissions.request(permission);
			} catch {
				granted = false;
			} finally {
				saveButton.disabled = false;
				shortenerInput.disabled = false;
			}
			if (!granted) {
				shortenerError.textContent = browser.i18n.getMessage('shortenerPermission');
				return;
			}
		}
		var remote_service = document.getElementById('remote_service').value;
		var webservice_endpoint_url = document.getElementById('webservice_endpoint_url').value;
		var api_endpoint_url = document.getElementById('api_endpoint_url').value;
		var api_token = document.getElementById('api_token').value;
		localStorage.setItem('remote_service', remote_service);
		localStorage.setItem('webservice_endpoint_url', webservice_endpoint_url);
		localStorage.setItem('api_endpoint_url', api_endpoint_url);
		localStorage.setItem('api_token', api_token);
		saveShortenerEndpoint(endpoint);
		saveLabel.classList.remove('hide');
		saveTimeout = setTimeout(() => saveLabel.classList.add('hide'), 3000);
	});


});
