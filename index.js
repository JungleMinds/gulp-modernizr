var path = require("path"),
	gutil = require("gulp-util"),
	through = require("through"),
	customizr = require("customizr");

module.exports = function (fileName, opt) {
	"use strict";

	// Set some defaults
	var PLUGIN_NAME = "gulp-modernizr",
		DEFAULT_FILE_NAME = "modernizr.js";

	// Ensure fileName exists
	if (typeof fileName === "undefined") {
		fileName = DEFAULT_FILE_NAME;
	} else if (typeof fileName === typeof {}) {
		opt = fileName;
		fileName = DEFAULT_FILE_NAME;
	}

	// Ensure opt exists
	opt = opt || {};

	// Enable string parsing in customizr
	opt.useBuffers = true;

	// Set crawl to false, Gulp is providing files & data
	opt.crawl = false;

	// Reset opt.files. Store buffers here.
	opt.files = [];

	// Per Gulp docs (https://github.com/gulpjs/gulp/blob/master/docs/writing-a-plugin/guidelines.md)
	// "Your plugin shouldn't do things that other plugins are responsible for"
	opt.uglify = opt.uglify || false;

	// Save first file for metadata purposes
	var firstFile;

	function storeBuffers(file) {

		// Return if null
		if (file.isNull()) {
			return;
		}

		// No stream support (yet?)
		if (file.isStream()) {
			return stream.emit("error", new gutil.PluginError({
				plugin: PLUGIN_NAME,
				message: "Streaming not supported"
			}));
		}

		// Set first file
		if (!firstFile) {
			firstFile = file;
		}

		// Save buffer for later use
		opt.files.push(file);
	}

	function generateModernizr() {

		// Call customizr
		customizr(opt, function (data) {

			// Sanity check
			if (!data.result) {
				return stream.emit("error", new gutil.PluginError({
					plugin: PLUGIN_NAME,
					message: "No data returned"
				}));
			}

			// Save result
			var file = new gutil.File({
				path: path.join(firstFile.base, fileName),
				base: firstFile.base,
				cwd: firstFile.cwd,
				contents: new Buffer(data.result)
			});

			// Pass data along
			stream.queue(file);

			// Clear the queue
			stream.queue(null);
		});
	}

	var stream = through(storeBuffers, generateModernizr);
	return stream;
};
