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
		console.log(('\nPulling docker image: ' + self.image).green);
	}

	var pull = spawn('docker', ['pull', this.image], options);

	pull.on('exit', function(code) {
		if (0 === code) {
			finishedCallback();
		} else {
			console.error(('\nCould not pull Docker image: ' + self.image).red);
			process.exit(1);
		}
	});

	return pull;
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
		if (0 !== code || !containerId) {
			console.error('\nFailed to start and mount Docker container'.red);
			process.exit(1);
		}

		finishedCallback(containerId);
	});

	return run;
};

/**
 * Run specific before script
 *
 * @param options
 * @param index
 * @param containerId
 * @param finishedCallback
 */
Container.prototype.runBeforeScript = function(options, index, containerId, finishedCallback) {
	var self = this;

	spawn('sh', ['-c', 'docker exec ' + containerId + ' ' + self.beforeScripts[index]], options).on('exit', function(code) {
		if (0 !== code) {
			console.error(('\nFailed to run before script: ' + self.beforeScripts[index]).red);
			process.exit(1);
		}

		index++;

		finishedCallback(index, containerId);
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

	var nextCallback = function(newIndex, containerId) {
		if (newIndex === self.beforeScripts.length) {
			finishedCallback();
		} else {
			self.runBeforeScript(options, newIndex, containerId, nextCallback);
		}
	};

	self.runBeforeScript(options, 0, containerId, nextCallback);
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

	if (global.testArgs._ && global.testArgs._.length) {
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

	var exec = spawn('sh', ['-c', 'docker exec -i ' + containerId + ' bash + -c "source ~/.bashrc && ' + self.testCommand + ' ' + testArgString + ' " 1>&2'], { stdio: 'inherit' }).on('exit', function(code) {
		if (code > 1) {
			console.error('\nFailed to run test command'.red);
			process.exit(code);
		}

		finishedCallback(code);
	});

	return exec;
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

	var stop = spawn('docker', ['stop', containerId], options).on('exit', function(code) {
		if (0 === code) {
			if (global.config.verbose) {
				console.log('\nStopped container'.green);
			}

			finishedCallback();
		} else {
			console.error(('\nCould not stop container: ' + containerId).red);
			process.exit(1);
		}
	});

	return stop;
};

/**
 * Remove Docker container
 *
 * @param options
 * @param containerId
 * @param finishedCallback
 */
Container.prototype.removeContainer = function(options, containerId, finishedCallback) {
	var remove = spawn('docker', ['rm', containerId], options).on('exit', function(code) {

		if (0 === code) {
			if (global.config.verbose) {
				console.log('\nRemoved container'.green);
			}

			finishedCallback();
		} else {
			console.error(('\nCould not remove container: ' + containerId).red);
			process.exit(1);
		}
	});

	return remove;
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

					self.runTests({ stdio: 'inherit' }, containerId, function(code) {

						self.stopContainer({}, containerId, function() {

							self.removeContainer({}, containerId, function() {

								finishedCallback(code);

							});
						});
					});
				});
			} else {
				self.runTests({ stdio: 'inherit' }, containerId, function(code) {

					self.stopContainer({}, containerId, function() {

						self.removeContainer({}, containerId, function() {

							finishedCallback(code);

						});
					});
				});
			}
		});
	});
};


exports.container = Container;