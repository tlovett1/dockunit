'use strict';

const readFileSync = require('fs').readFileSync;
let argv = require('minimist')(process.argv.slice(2));
const Containers = require('./containers');
const spawn = require('child_process').spawn;
const _version = require('../package.json').version;
require('colors');

/**
 * Set globals for command
 */
const setGlobals = exports.setGlobals = () => {
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
		'du-verbose': 0,
		'du-container': false,
		help: false,
		version: false
	};
};

setGlobals();

/**
 * Process command line options and arguments
 */
const processArgs = exports.processArgs = (args) => {
	global.testArgs = args;

	if (args['du-verbose']) {
		global.config.verbose = parseInt(args['du-verbose']);

		if (isNaN(global.config.verbose)) {
			global.config.verbose = 1;
		}
	} else {
		global.config.verbose = 0;
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
module.exports.execute = () => {
	var json;
	processArgs(argv);

	if (global.config.help) {
		var help = `
${'Usage:'.yellow}
  dockunit <path-to-project-directory> [options]

${'Options:'.yellow}
  ${'--du-verbose'.green} Output various lines of status throughout testing
  ${'--help'.green}       Display this help text
  ${'--version'.green}    Display current version
`;
		console.log(help);
		process.exit(0);
	}

	if (global.config.version) {
		console.log(`Dockunit ${_version} by Taylor Lovett`);
		process.exit(0);
	}

	var docker = spawn('docker', []);

	docker.on('error', function(error) {
		console.error('Docker is not installed or configured properly'.red);
	});

	docker.on('exit', function(code) {
		try {
			json = JSON.parse(readFileSync(global.config.path + '/Dockunit.json', 'utf8'));
		} catch (exception) {
			console.error('Could not parse Dockunit.json'.red);
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
				console.log('No containers finished'.bgYellow);
			} else {
				if (!errors) {
					console.log(`${returnCodes.length} container(s) passed`.bgGreen);
				} else {
					console.error(`${returnCodes.length - errors} out of ${returnCodes.length} container(s) passed`.bgRed);
					process.exit(1);
				}
			}
		}, global.config.container);
	});
}