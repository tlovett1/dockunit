'use strict';

var fs = require('fs');
var argv = require('minimist')(process.argv.slice(2));
var Containers = require('./containers').containers;

/**
 * Configuration for dockunit
 *
 * @type {{path: *, verbose: boolean}}
 */
global.config = {
	path: process.cwd(),
	verbose: false
};

/**
 * Test arguments to pass to test command
 */
global.testArgs = {};

/**
 * Supported dockunit arguments/options
 *
 * @type {{du-verbose: boolean}}
 */
global.defaultArgs = {
	'du-verbose': false
};

/**
 * Process command line options and arguments
 */
var processArgs = function() {
	global.testArgs = argv;

	if (argv['du-verbose']) {
		global.config.verbose = true;
	}

	if (argv._.length) {
		global.config.path = argv._[0];
		delete global.testArgs._[0];
	}

	for (var key in global.testArgs) {
		if (key !== '_' && typeof global.defaultArgs[key] !== 'undefined') {
			delete global.testArgs[key];
		}
	}
};

/**
 * Main script command
 */
exports.execute = function() {
	var json;
	processArgs();

	try {
		json = JSON.parse(fs.readFileSync(global.config.path + '/Dockunit.json', 'utf8'));
	} catch (exception) {
		console.log('Could not parse Dockunit.json');
		process.exit(1);
	}

	var containers = new Containers(json.containers);
	containers.run();
};