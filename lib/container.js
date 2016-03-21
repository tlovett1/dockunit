'use strict';

var spawn = require('child_process').spawn;
var colors = require('colors');
var Docker = require('rouster').Docker;

var reformCommand = function(cmd){
    return cmd.match(/"[^"]+"|'[^']+'|[^ \t]+/g);
}

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
    this.dockerCommand = containerArray.dockerCommand || 'docker';
    this.shellCommand = containerArray.shellCommand || '/bin/bash';
    this.docker = new Docker({
        image: this.image,
        dockerCommand: this.dockerCommand
    });
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

    var pull = this.docker.pull(function(err, output){
        if(err){
            console.error(('\nCould not pull Docker image: ' + self.image).red);
            return process.exit(1);
        }
        finishedCallback();
    });
/*
    var pull = spawn('docker', ['pull', this.image], options);

    pull.on('exit', function(code) {
        if (0 === code) {
            finishedCallback();
        } else {
            console.error(('\nCould not pull Docker image: ' + self.image).red);
            process.exit(1);
        }
    });
*/
    return pull;
};

/**
 * Start and mount Docker container
 *
 * @param options
 * @param finishedCallback
 */
Container.prototype.startAndMountContainer = function(options, finishedCallback) {
    var self = this;
    return self.docker.run(self.shellCommand, '-v', global.config.path + ':/app/src', '-w', '/app/test', function(err){
        if(err){
            console.error('\nFailed to start and mount Docker container'.red);
            return process.exit(1);
        }
        finishedCallback(self.docker.containerId);
    });
/*
    var containerId,
        self = this,
        run = spawn('docker', ['run', '-d', '-v', global.config.path + ':/app/test', '-w', '/app/test', '-it', self.image, '/bin/bash']);

    // Dump errors to the stderr output so they can be seen.
    run.stderr.on('data', function(data) {
        console.error('ERROR: ', data.toString());
        console.error('COMMAND: ', 'docker', 'run', '-d', '-v', global.config.path + ':/app/test', '-w', '/app/test', '-it', self.image, '/bin/bash');
    });

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
*/
};

/**
 * Create a copy of mounted files for testing
 *
 * @param options
 * @param containerId
 * @param finishedCallback
 */
Container.prototype.createWorkingCopy = function(options, containerId, finishedCallback) {

    if (global.config.verbose) {
        console.log(('\nBacking up volume files on container ' + this.prettyName).green);
    }

    var exec = this.docker.exec('cp', '-R', '/app/src/.', '/app/test', function(err, output){
        if(err){
            console.error('\nFailed to create working copy'.red);
            return process.exit(1);
        }
        finishedCallback(output.code);
    });
/*
    var exec = spawn('sh', ['-c', 'docker exec ' + containerId + ' bash + -c "source ~/.bashrc && cp -p -r /app/test /app/backup"']).on('exit', function(code) {
        if (code !== 0) {
            console.error('\nFailed to backup up files'.red);
        }

        finishedCallback(code);
    });

    return exec;
*/
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
    self.docker.exec(reformCommand(self.beforeScripts[index]), function(err, output){
        if(err){
            console.error(('\nFailed to run before script: ' + self.beforeScripts[index]).red);
            return process.exit(1);
        }
        finishedCallback(index+1, containerId, output.code);
    });

    /*
    spawn('sh', ['-c', 'docker exec ' + containerId + ' ' + self.beforeScripts[index]], options).on('exit', function(code) {
        if (0 !== code) {
            console.error(('\nFailed to run before script: ' + self.beforeScripts[index]).red);
        }

        index++;

        finishedCallback(index, containerId, code);
    });
    */
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

    options = { stdio: ['ignore', 'ignore', 'ignore'] };

    if (global.config.verbose > 1) {
        options = { stdio: 'inherit' };
    }

    if (global.config.verbose) {
        console.log('\nRunning before scripts'.green);
    }

    if (!self.beforeScripts.length) {
        finishedCallback(0);
    }

    var nextCallback = function(newIndex, containerId, code) {
        if (code !== 0) {
            finishedCallback(1, newIndex);
        } else {
            if (newIndex === self.beforeScripts.length) {
                finishedCallback(code, newIndex);
            } else {
                self.runBeforeScript(options, newIndex, containerId, nextCallback);
            }
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

    /*
    var exec = spawn('sh', ['-c', 'docker exec ' + containerId + ' bash + -c "source ~/.bashrc && ' + self.testCommand + ' ' + testArgString + ' " 1>&2'], { stdio: 'inherit' }).on('exit', function(code) {
        if (code !== 0) {
            console.error('\nFailed to run test command'.red);
        }

        finishedCallback(code);
    });
    */
    var exec = self.docker.exec(reformCommand(self.testCommand), function(err, output){
        if(err){
            console.error('\nFailed to run test command'.red);
            return finishedCallback(err.code);
        }
        finishedCallback(output.code);
    });

    return exec;
};


/**
 * Clean up volume files in container
 *
 * @param options
 * @param containerId
 * @param finishedCallback
 */
Container.prototype.cleanupFiles = function(options, containerId, finishedCallback) {
// No longer needed since we create a working copy to deal with instead of dirtying the local disk
    return finishedCallback(0);
/*
    if (global.config.verbose) {
        console.log(('\nRestoring volume files on container ' + this.prettyName).green);
    }

    var exec = spawn('sh', ['-c', 'docker exec ' + containerId + ' bash + -c "source ~/.bashrc && rm -rf /app/test/* && cp -p -r /app/backup/* /app/test " 1>&2'], { stdio: 'inherit' }).on('exit', function(code) {
        if (code !== 0) {
            console.error('\nFailed to restore volume files'.red);
        }

        finishedCallback(code);
    });

    return exec;
    */
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

    var stop = self.docker.stop(function(err, output){
        if(err){
            console.error(('\nCould not stop container: ' + containerId).red);
            return process.exit(1);
        }
        if (global.config.verbose) {
            console.log('\nStopped container'.green);
        }
        finishedCallback();
    });
/*
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
*/

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
    var remove = this.docker.rm(function(err, output){
        if(err){
            console.error(('\nCould not remove container: ' + containerId).red);
            return process.exit(1);
        }
        if (global.config.verbose) {
            console.log('\nRemoved container'.green);
        }

        finishedCallback();
    });
    /*
    var remove = spawn('docker', ['rm', '-v', containerId], options).on('exit', function(code) {

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
    */

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
        self.docker.on('stderr', function(str){
            console.error(str);
        });
        self.docker.on('stdout', function(str){
            console.error(str);
        });
    }

    console.log(('\nTesting on container ' + self.prettyName + '').green);

    self.pullImage(options, function() {

        self.startAndMountContainer({}, function(containerId) {

            self.createWorkingCopy({}, containerId, function() {

                if (self.beforeScripts && self.beforeScripts.length) {

                    self.runBeforeScripts(options, containerId, function(code) {

                        if (code !== 0) {
                            self.cleanupFiles({}, containerId, function() {

                                self.stopContainer({}, containerId, function() {

                                    self.removeContainer({}, containerId, function() {

                                        finishedCallback(code);

                                    });
                                });
                            });
                        } else {
                            self.runTests({ stdio: 'inherit' }, containerId, function(code) {

                                self.cleanupFiles({}, containerId, function() {

                                    self.stopContainer({}, containerId, function() {

                                        self.removeContainer({}, containerId, function() {

                                            finishedCallback(code);

                                        });
                                    });
                                });
                            });
                        }
                    });
                } else {
                    self.runTests({ stdio: 'inherit' }, containerId, function(code) {

                        self.cleanupFiles({}, containerId, function() {

                            self.stopContainer({}, containerId, function() {

                                self.removeContainer({}, containerId, function() {

                                    finishedCallback(code);

                                });
                            });
                        });
                    });
                }
            });
        });
    });
};


exports.container = Container;
