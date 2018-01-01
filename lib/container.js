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
 */
Container.prototype.pullImage = function() {
	return new Promise((resolve, reject) => {
		var self = this;

		if (global.config.verbose) {
			console.log(`Pulling docker image: ${self.image}`.green);
		}

		var pull = spawn('docker', ['pull', this.image]);

		pull.on('exit', (code) => {
			if (0 === code) {
				resolve();
			} else {
				console.error(`Could not pull Docker image: ${self.image}`.red);
				reject();
			}
		});
	});
};

/**
 * Start and mount Docker container
 */
Container.prototype.startAndMountContainer = function() {
	return new Promise((resolve, reject) => {
		console.log('Starting container...'.green);
		let containerId;

		const self = this,
			  run = spawn('docker', ['run', '-d', '-v', `${global.config.path}:/app/test`, '-w', '/app/test', '-it', self.image, '/bin/bash']);

		// Dump errors to the stderr output so they can be seen.
		run.stderr.on('data', (data) => {
			console.error('ERROR: ', data.toString());
			console.error('COMMAND: ', 'docker', 'run', '-d', '-v', `${global.config.path}:/app/test`, '-w', '/app/test', '-it', self.image, '/bin/bash');
		});

		// Sanitize and store container ID
		run.stdout.on('data', (data) => {
			containerId = data.toString().trim().replace(/[^a-z0-9]/ig, '');
		})

		run.on('exit', (code) => {
			if (0 !== code || !containerId) {
				console.error('Failed to start and mount Docker container'.red);
				reject();
			}

			resolve(containerId);
		});
	});
};

/**
 * Create a copy of mounted files for later
 *
 * @param containerId
 */
Container.prototype.backupFiles = function(containerId) {
	return new Promise((resolve, reject) => {
		if (global.config.verbose) {
			console.log(`Backing up volume files on container ${this.prettyName}`.green);
		}

		var exec = spawn('sh', ['-c', `docker exec ${containerId} bash -c "source ~/.bashrc && cp -p -r /app/test /app/backup"`])

		exec.on('exit', (code) => {
			if (code !== 0) {
				console.error('Failed to backup up files'.red);
				reject();
			}

			resolve(containerId);
		});
	});
};

/**
 * Run specific before script
 *
 * @param containerId
 * @param script
 */
Container.prototype.runBeforeScript = function(containerId, script) {
	return new Promise((resolve, reject) => {
		const self = this;

		const opts = {stdio: ['ignore','ignore','ignore'] }
		if (global.config.verbose > 1) {
			opts.stdio = 'inherit';
		}

		const before = spawn('sh', ['-c', `docker exec ${containerId} ${script}`], opts)

		before.on('exit', (code) => {
			if (0 !== code) {
				console.error(`Failed to run before script: ${script}`.red);
				reject();
			}

			resolve(containerId);
		});
	});
};

/**
 * Run before scripts for container
 *
 * @param containerId
 */
Container.prototype.runBeforeScripts = async function(containerId) {
	const self = this;

	if (self.beforeScripts && self.beforeScripts.length) {
		if (global.config.verbose) {
			console.log('Running before scripts'.green);
		}

		for (const s of self.beforeScripts) {
			await self.runBeforeScript.call(self, containerId, s);
		}
	}

	return containerId;
};

/**
 * Run unit tests for container
 *
 * @param containerId
 */
Container.prototype.runTests = function(containerId) {
	var self = this,
		testArgString = '';

	return new Promise((resolve, reject) => {
		if (global.testArgs._ && global.testArgs._.length) {
			testArgString = global.testArgs._.join(' ');
		}

		for (var key in global.testArgs) {
			if ('_' !== key) {
				if (typeof global.testArgs[key] !== 'boolean') {
					testArgString += ` --${key}=${global.testArgs[key]}`;
				} else {
					if (global.testArgs[key]) {
						testArgString += ` --${key}`;
					}
				}
			}
		}

		if (global.config.verbose) {
			console.log(`Running "${self.testCommand} ${testArgString}" on container ${self.prettyName}`.green);
		}

		var exec = spawn('sh', ['-c', `docker exec ${containerId} bash -c "source ~/.bashrc && ${self.testCommand} ${testArgString}" 1>&2`], { stdio: 'inherit' })

		exec.on('exit', (code) => {
			if (code !== 0) {
				console.error('Failed to run test command'.red);
				reject();
			}

			resolve(containerId, code);
		});
	});
};

/**
 * Clean up volume files in container
 *
 * @param containerId
 */
Container.prototype.cleanupFiles = function(containerId) {
	return new Promise((resolve, reject) => {
		if (global.config.verbose) {
			console.log(`Restoring volume files on container ${this.prettyName}`.green);
		}

		var exec = spawn('sh', ['-c', `docker exec ${containerId} bash -c "source ~/.bashrc && rm -rf /app/test/* && cp -p -r /app/backup/* /app/test" 1>&2`], { stdio: 'inherit' })

		exec.on('exit', (code) => {
			if (code !== 0) {
				console.error('Failed to restore volume files'.red);
				reject();
			}

			resolve(containerId);
		});
	});
};

/**
 * Stop Docker container
 *
 * @param containerId
 */
Container.prototype.stopContainer = function(containerId) {
	var self = this;

	return new Promise((resolve, reject) => {
		const stop = spawn('docker', ['stop', containerId])

		stop.on('exit', (code) => {
			if (0 === code) {
				if (global.config.verbose) {
					console.log('Stopped container'.green);
				}

				resolve(containerId);
			} else {
				console.error(`Could not stop container: ${containerId}`.red);
				reject();
			}
		});
	});
};

/**
 * Remove Docker container
 *
 * @param containerId
 */
Container.prototype.removeContainer = function(containerId) {
	return new Promise((resolve, reject) => {
		const remove = spawn('docker', ['rm', '-v', containerId])

		remove.on('exit', (code) => {
			if (0 === code) {
				if (global.config.verbose) {
					console.log('Removed container'.green);
				}

				resolve(containerId);
			} else {
				console.error(`Could not remove container: ${containerId}`.red);
				reject();
			}
		});
	});
};

/**
 * Run tests on given container object
 *
 * @param finishedCallback
 */
Container.prototype.run = function(finishedCallback) {
	const self = this;

	console.log(`\nTesting on container ${self.prettyName}`.green);

	const p = self.pullImage.call(self)
		.then(self.startAndMountContainer.bind(self))
		.then(self.backupFiles.bind(self))
		.then(self.runBeforeScripts.bind(self))
		.then(self.runTests.bind(self))
		.then(self.cleanupFiles.bind(self))
		.then(self.stopContainer.bind(self))
		.then(self.removeContainer.bind(self))
		.then(() => finishedCallback(0))
		.catch(() => finishedCallback(255))
};


exports.container = Container;
