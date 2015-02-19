'use strict';

var spawn = require('child_process').spawn;
var colors = require('colors');

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
 * Pull docker image for current container
 *
 * @param finishedCallback
 */
Container.prototype.pullImage = function(options, finishedCallback) {
	var self = this;

	if (global.config.verbose) {
		console.log(('\nPulling docker image: ' + self.image + '').green);
	}

	spawn('docker', ['pull', this.image], options).on('exit', finishedCallback);
};

/**
 * Start and mount Docker container
 *
 * @param options
 * @param finishedCallback
 */
Container.prototype.startAndMountContainer = function(options, finishedCallback) {
	var containerId,
		self = this,
		run = spawn('docker', ['run', '-d', '-v', global.config.path + ':/app/test', '-w', '/app/test', '-it', self.image, '/bin/bash']);

	// Sanitize and store container ID
	run.stdout.on('data', function(data) {
		containerId = data.toString().trim().replace(/[^a-z0-9]/ig, '');
	});

	run.on('exit', function(code) {
		if (!containerId) {
			console.log('\nFailed to start and mount Docker container'.red);
			process.exit(1);
		}

		finishedCallback(containerId);
	});
};

/**
 * Run before scripts for container
 *
 * @param options
 * @param containerId
 * @param finishedCallback
 */
Container.prototype.runBeforeScripts = function(options, containerId, finishedCallback) {
	var self = this;

	if (global.config.verbose) {
		console.log('\nRunning before scripts'.green);
	}

	if (!self.beforeScripts.length) {
		finishedCallback();
	}

	var index = 0;

	var runBeforeScript = function() {
		spawn('sh', ['-c', 'docker exec ' + containerId + ' ' + self.beforeScripts[index]], options).on('exit', function(code) {

			index++;

			if (index === self.beforeScripts.length) {
				finishedCallback();
			} else {
				runBeforeScript();
			}

		});
	};

	runBeforeScript();
};

/**
 * Run unit tests for container
 *
 * @param options
 * @param containerId
 * @param finishedCallback
 */
Container.prototype.runTests = function(options, containerId, finishedCallback) {
	var self = this,
		testArgString = '';

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
		console.log(('\nRunning "' + self.testCommand + testArgString + '" on container '+ self.prettyName).green);
	}

	spawn('sh', ['-c', 'docker exec -i ' + containerId + ' bash + -c "source ~/.bashrc && ' + self.testCommand + ' ' + testArgString + ' " 1>&2'], { stdio: 'inherit' }).on('exit', function(code) {
		finishedCallback();
	});
};

/**
 * Stop Docker container
 *
 * @param options
 * @param containerId
 * @param finishedCallback
 */
Container.prototype.stopContainer = function(options, containerId, finishedCallback) {
	var self = this;

	spawn('docker', ['stop', containerId], options).on('exit', function(code) {
		if (global.config.verbose) {
			console.log('\nStopped container'.green);
		}

		finishedCallback();
	});
};

/**
 * Remove Docker container
 *
 * @param options
 * @param containerId
 * @param finishedCallback
 */
Container.prototype.removeContainer = function(options, containerId, finishedCallback) {
	spawn('docker', ['rm', containerId], options).on('exit', function(code) {
		if (global.config.verbose) {
			console.log('\nRemoved container'.green);
		}

		finishedCallback();
	});
};

/**
 * Run tests on given container object
 *
 * @param finishedCallback
 */
Container.prototype.run = function(finishedCallback) {
	var self = this,
		options = {};

	if (global.config.verbose) {
		options = { stdio: 'inherit' };
	}

	console.log(('\nTesting on container ' + self.prettyName + '').green);

	self.pullImage(options, function() {

		self.startAndMountContainer({}, function(containerId) {

			if (self.beforeScripts && self.beforeScripts.length) {

				self.runBeforeScripts(options, containerId, function() {

					self.runTests({ stdio: 'inherit' }, containerId, function() {

						self.stopContainer({}, containerId, function() {

							self.removeContainer({}, containerId, function() {

								finishedCallback();

							});
						});
					});
				});
			} else {
				self.runTests({ stdio: 'inherit' }, containerId, function() {

					self.stopContainer({}, containerId, function() {

						self.removeContainer({}, containerId, function() {

							finishedCallback();

						});
					});
				});
			}
		});
	});
};


exports.container = Container;