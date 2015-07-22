'use strict';

var fs = require('fs');
var argv = require('minimist')(process.argv.slice(2));
var Containers = require('./containers').containers;
var spawn = require('child_process').spawn;
var packageObject = require('../package.json');
var colors = require('colors');

/**
 * Set globals for command
 */
var setGlobals = exports.setGlobals = function() {
	/**
	 * Configuration for dockunit
	 *
	 * @type {{path: *, verbose: boolean, help: boolean, version: boolean, container: boolean}}
	 */
	global.config = {
		path: process.cwd(),
		verbose: false,
		help: false,
		version: false,
		container: false
	};

	/**
	 * Test arguments to pass to test command
	 */
	global.testArgs = {};

	/**
	 * Supported dockunit arguments/options
	 *
	 * @type {{du-verbose: boolean, du-container: boolean, help: boolean, version: boolean}}
	 */
	global.defaultArgs = {
		'du-verbose': false,
		'du-container': false,
		help: false,
		version: false
	};
};

setGlobals();

/**
 * Process command line options and arguments
 */
var processArgs = exports.processArgs = function(args) {
	global.testArgs = args;

	if (args['du-verbose']) {
		global.config.verbose = true;
	}

	if (typeof args['du-container'] !== 'undefined' && parseInt(args['du-container']) >= 0) {
		global.config.container = parseInt(args['du-container']);
	}

	if (args.help) {
		global.config.help = true;
	}


	if (args.version) {
		global.config.version = true;
	}

	if (args._.length) {
		global.config.path = args._[0];

		// First argument is assumed to be the dockunit path
		global.testArgs._.shift();
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
	processArgs(argv);

	if (global.config.help) {
		var help = '\nUsage:\n'.yellow +
			'  dockunit <path-to-project-directory> [options]\n' +
			'\n' +
			'\nOptions:'.yellow +
			'\n  --du-verbose'.green + ' Output various lines of status throughout testing' +
			'\n  --help'.green + ' Display this help text' +
			'\n  --version'.green + ' Display current version' +
			'\n';
		console.log(help);
		process.exit(0);
	}

	if (global.config.version) {
		console.log('\nDockunit ' + packageObject.version + ' by Taylor Lovett\n');
		process.exit(0);
	}

	var docker = spawn('docker', []);

	docker.on('error', function(error) {
		console.error('\nDocker is not installed or configured properly'.red);
	});

	docker.on('exit', function(code) {
		try {
			json = JSON.parse(fs.readFileSync(global.config.path + '/Dockunit.json', 'utf8'));
		} catch (exception) {
			console.error('\nCould not parse Dockunit.json'.red);
			process.exit(255);
		}

		var containers = new Containers(json.containers);

		containers.run(function(returnCodes) {
			var errors = 0;

			for (var i = 0; i < returnCodes.length; i++) {
				if (returnCodes[i] !== 0) {
					errors++;
				}
			}

			if (!returnCodes.length) {
				console.log(('\nNo containers finished').bgYellow + '\n');
			} else {
				if (!errors) {
					console.log(('\n' + returnCodes.length + ' container(s) passed').bgGreen + '\n');
				} else {
					console.error(('\n' + (returnCodes.length - errors) + ' out of ' + returnCodes.length + ' container(s) passed').bgRed + '\n');
					process.exit(1);
				}
			}
		}, global.config.container);
	});
};