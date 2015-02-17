'use strict';

var fs = require('fs');
var argv = require('minimist')(process.argv.slice(2));
var Containers = require('./containers').containers;
var spawn = require('child_process').spawn;
var packageObject = require('../package.json');

/**
 * Configuration for dockunit
 *
 * @type {{path: *, verbose: boolean, help: boolean, version: boolean}}
 */
global.config = {
	path: process.cwd(),
	verbose: false,
	help: false,
	version: false
};

/**
 * Test arguments to pass to test command
 */
global.testArgs = {};

/**
 * Supported dockunit arguments/options
 *
 * @type {{du-verbose: boolean, help: boolean, version: boolean}}
 */
global.defaultArgs = {
	'du-verbose': false,
	help: false,
	version: false
};

/**
 * Process command line options and arguments
 */
var processArgs = function() {
	global.testArgs = argv;

	if (argv['du-verbose']) {
		global.config.verbose = true;
	}

	if (argv['help']) {
		global.config.help = true;
	}

	if (argv['version']) {
		global.config.version = true;
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

	if (global.config.help) {
		var help = '\nUsage: dockunit <path-to-project-directory> [options]'
			+ '\n'
			+ '\nOptions:'
			+ '\n --du-verbose Output various lines of status throughout testing'
			+ '\n --help Display this help text'
			+ '\n --version Display current version'
			+ '\n';
		console.log(help);
		process.exit(1);
	}

	if (global.config.version) {
		console.log('\nDockunit ' + packageObject.version + ' by Taylor Lovett\n');
		process.exit(1);
	}

	var docker = spawn('docker', []);

	docker.on('error', function(error) {
		console.log('Docker is not installed or configured properly');
	});

	docker.on('exit', function(code) {
		try {
			json = JSON.parse(fs.readFileSync(global.config.path + '/Dockunit.json', 'utf8'));
		} catch (exception) {
			console.log('Could not parse Dockunit.json');
			process.exit(1);
		}

		var containers = new Containers(json.containers);
		containers.run();
	});
};