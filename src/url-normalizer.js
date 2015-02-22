var url = require('url');

module.exports = (function () {
	'use strict';

	function UrlNormalizer () {
		this.queryParamsBlacklist = [
			/^utm_/,
			/session/
		];
	}

	UrlNormalizer.prototype.normalize = function (rawUrl) {
		rawUrl = rawUrl.trim();

		if (rawUrl.slice(0, 4) !== 'http' && rawUrl.slice(0, 2) !== '//') {
			rawUrl = 'http://' + rawUrl;
		}

		/*
		 * Safe rule n°2
		 * -> Uppercase %-hex escaped characters.
		 */
		rawUrl = rawUrl.replace(/%[0-9a-f]{2}/gi, function (hexGroup) {
			return hexGroup.toUpperCase();
		});

		/*
		 * --- TODO ---
		 * Safe rule n°3
		 * -> Unescape "unreserved" characters.
		 * --- TODO ---
		 */

		var parsedUrl = url.parse(rawUrl, true);

		/*
		 * Safe rule n°4
		 * -> Add default port (80 for HTTP and 443 for HTTPS)
		 */
		if (parsedUrl.protocol === 'http:' && parsedUrl.port === null) {
			parsedUrl.port = '80';
		}
		else if (parsedUrl.protocol === 'https:' && parsedUrl.port === null) {
			parsedUrl.port = '443';
		}

		/*
		 * Mostly-Safe rule n°1
		 * -> Add tralling slash
		 */
		if (parsedUrl.pathname !== null && parsedUrl.pathname[parsedUrl.pathname.length - 1] !== '/') {
			parsedUrl.pathname += '/';
		}

		/*
		 * Mostly-Safe rule n°2
		 * -> Resolve relative path
		 */
		parsedUrl.pathname = url.parse(
			url.resolve([
					parsedUrl.protocol,
					'//',
					parsedUrl.hostname,
					':',
					parsedUrl.port,
					parsedUrl.pathname
				].join(''),
				parsedUrl.pathname
			),
			true
		)
		.pathname;

		/*
		 * Unsafe rule n°3
		 * -> Remove fragment
		 */
		if (parsedUrl.hash !== null) {
			parsedUrl.hash = null;
		}

		/*
		 * Unsafe rule n°8,10
		 * -> Sort querystring parameters
		 * -> Remove querystring parameters like utm_* and *session*
		 */

		var query = parsedUrl.query || {};
		parsedUrl.query = null;
		parsedUrl.search = null;
		parsedUrl.path = null;
		parsedUrl.pathname = null;

		/*
		 * Safe rule n°1
		 * -> Lowercase url.
		 */
		var normalizedUrl = url.format(parsedUrl);

		/*
		var keys = Object.keys(query).sort();
		var value;
		var key;

		for (var i = 0, len = keys.length; i < len; i++) {
			if (i === 0) {
				normalizedUrl += '?';
			}

			key = keys[i];
			value = query[key];

			if (this.isBlacklistedQueryParam(key)) {
				continue;
			}

			normalizedUrl += this.percentEncode(key);
			normalizedUrl += '=';
			normalizedUrl += this.percentEncode(value);

			if (i !== len - 1) {
				normalizedUrl += '&';
			}
		}
		*/

		return normalizedUrl;
	};

	UrlNormalizer.prototype.percentEncode = function (queryParam) {
		return encodeURIComponent(queryParam)
			.replace(/ /g, '%20')
			.replace(/\*/g, '%2A')
			.replace(/%7e/g, '%2A');
	};

	UrlNormalizer.prototype.isBlacklistedQueryParam = function (queryParam) {
		var match = false;
		var len = this.queryParamsBlacklist.length;
		var regexp;

		while (len-- && match === false) {
			regexp = this.queryParamsBlacklist[len];

			if (regexp.test(queryParam)) {
				match = true;
			}
		}

		return match;
	};

	return new UrlNormalizer();
})();
