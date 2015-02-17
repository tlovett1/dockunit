'use strict';

var spawn = require('child_process').spawn;

/**
 * Initialize a new container
 *
 * @param containerArray
 * @constructor
 */
var Container = function(containerArray) {
	this.image = containerArray.image;
	this.testCommand = containerArray.testCommand;
	this.prettyName = containerArray.prettyName;
	this.beforeScripts = containerArray.beforeScripts;
};

/**
 * Run tests on given container object
 */
Container.prototype.run = function() {
	var self = this,
		containerId,
		options = {};

	if (global.config.verbose) {
		options = { stdio: 'inherit' };
	}

	console.log('Testing on container ' + self.prettyName);

	if (global.config.verbose) {
		console.log('Pulling docker image: ' + self.image);
	}

	spawn('docker', ['pull', this.image], options).on('exit', function(code) {

		var run = spawn('docker', ['run', '-d', '-v', global.config.path + ':/app/test', '-w', '/app/test', '-it', self.image, '/bin/bash']);

		// Sanitize and store container ID
		run.stdout.on('data', function(data) {
			containerId = data.toString().trim().replace(/[^a-z0-9]/ig, '');
		});

		run.on('exit', function(code) {

			if (self.beforeScripts && self.beforeScripts.length) {
				if (global.config.verbose) {
					console.log('Running before scripts');
				}

				if (self.beforeScripts.length) {

					var index = 0;

					var runBeforeScript = function() {
						spawn('sh', ['-c', 'docker exec ' + containerId + ' ' + self.beforeScripts[index]], options).on('exit', function(code) {

							index++;

							if (index === self.beforeScripts.length) {
								runTest();
							} else {
								runBeforeScript();
							}

						});
					};

					runBeforeScript();

				} else {
					runTest();
				}
			}

			function runTest() {
				var testArgString = '';

				if (global.testArgs._.length) {
					testArgString = global.testArgs._.join(' ');
				}

				for (var key in global.testArgs) {
					if ('_' !== key) {
						if (typeof global.testArgs[key] !== 'boolean') {
							testArgString += ' --' + key + '=' + global.testArgs[key];
						} else {
							if (global.testArgs[key]) {
								testArgString += ' --' + key;
							}
						}
					}
				}

				if (global.config.verbose) {
					console.log('Running "' + self.testCommand + testArgString + '" on container');
				}

				spawn('sh', ['-c', 'docker exec -i ' + containerId + ' bash + -c "source ~/.bashrc && ' + self.testCommand + ' ' + testArgString + ' " 1>&2'], { stdio: 'inherit' }).on('exit', function(code) {

					spawn('docker', ['stop', containerId]).on('exit', function(code) {
						if (global.config.verbose) {
							console.log('Stopped container');
						}

						spawn('docker', ['rm', containerId]).on('exit', function(code) {
							if (global.config.verbose) {
								console.log('Removed container');
							}
						});
					});
				});
			}
		});
	});
};


exports.container = Container;