var urlNormalizer = require('./url-normalizer');
var regexps = require('./regexps');
var async = require('async');
var path = require('path');
var fs = require('fs');

var outputDirName = path.resolve(
	__dirname,
	'../output'
);

var dataDirName = path.resolve(
	__dirname,
	'../data'
);

function searchURLs (filename, callback) {
	fs.readFile(
		dataDirName + '/' + filename,
		'utf8',
		function (e, text) {
			if (e) {
				return callback(e);
			}

			var matches = text.match(regexps.url);

			if (matches === null) {
				return callback(null);
			}

			matches = matches.map(function (url) {
				return urlNormalizer.normalize(url);
			});

			fs.appendFile(
				outputDirName + '/urls-list',
				matches.join('\n'),
				callback
			);
		}
	);
}

fs.readdir(
	dataDirName,
	function (e, filenames) {
		if (e) {
			throw e;
		}

		var total = filenames.length;
		var counter = -1;

		async.eachSeries(
			filenames,
			function (filename, cb) {
				counter += 1;
				console.log(
					counter + '/' + (total - 1),
					'Searching URLs in file', filename, '...'
				);

				searchURLs(filename, cb);
			},
			function (e) {
				if (e) {
					throw e;
				}
			}
		);
	}
);
