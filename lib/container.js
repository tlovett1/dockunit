'use strict';

var spawn = require('child_process').spawn;
var colors = require('colors');
var Docker = require('rouster').Docker;
var async = require('async');

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
Container.prototype.pullImage = function(finishedCallback) {
    var self = this;

    if (global.config.verbose) {
        console.log(('\nPulling docker image: ' + self.image).green);
    }

    var pull = this.docker.pull(function(err, output){
        if(err){
            console.error(('\nCould not pull Docker image: ' + self.image).red);
            if(err && err.all){
                console.error(err.all.join(''));
            }
            return process.exit(1);
        }
        return finishedCallback(null, output);
    });
    return pull;
};

/**
 * Start and mount Docker container
 *
 * @param finishedCallback
 */
Container.prototype.startAndMountContainer = function(finishedCallback) {
    var self = this;
    return self.docker.run(self.shellCommand, '-v', global.config.path + ':/app/src', '-w', '/app/test', function(err, output){
        if(err){
            console.error('\nFailed to start and mount Docker container'.red);
            if(err && err.all){
                console.error(err.all.join(''));
            }
            return process.exit(1);
        }
        return finishedCallback(null, output);
    });
};

/**
 * Create a copy of mounted files for testing
 *
 * @param finishedCallback
 */
Container.prototype.createWorkingCopy = function(finishedCallback) {

    if (global.config.verbose) {
        console.log(('\nCreating working directory on container ' + this.prettyName).green);
    }

    var exec = this.docker.exec('cp', '-R', '/app/src/.', '/app/test', function(err, output){
        if(err){
            console.error('\nFailed to create working copy'.red);
            if(err && err.all){
                console.error(err.all.join(''));
            }
            return finishedCallback(err);
        }
        return finishedCallback(null, output);
    });
};

/**
 * Run specific before script
 *
 * @param index
 * @param finishedCallback
 */
Container.prototype.runBeforeScript = function(script, finishedCallback) {
    var self = this;
    return self.docker.exec(reformCommand(script), function(err, output){
        if(err){
            console.error(('\nFailed to run before script: ' + script).red);
            if(err && err.all){
                console.error(err.all.join(''));
            }
            return finishedCallback(err);
        }
        return finishedCallback(null, output);
    });
};

/**
 * Run before scripts for container
 *
 * @param finishedCallback
 */
Container.prototype.runBeforeScripts = function(finishedCallback) {
    var self = this;

    if (global.config.verbose) {
        console.log('\nRunning before scripts'.green);
    }

    if (!self.beforeScripts.length) {
        return finishedCallback();
    }

    return async.eachSeries(self.beforeScripts, function(script, next){
        self.runBeforeScript(script, next);
    }, finishedCallback);
};

/**
 * Run unit tests for container
 *
 * @param finishedCallback
 */
Container.prototype.runTests = function(finishedCallback) {
    var self = this,
        testArgString = '';

    if (global.testArgs._ && global.testArgs._.length) {
        testArgString = global.testArgs._.join(' ');
    }

    for (var key in global.testArgs) {
        if ('_' !== key) {
            if (typeof global.testArgs[key] !== 'boolean') {
                testArgString += ' --' + key + '=' + global.testArgs[key];
                continue;
            }
            if (global.testArgs[key]) {
                testArgString += ' --' + key;
                continue;
            }
        }
    }

    if (global.config.verbose) {
        console.log(('\nRunning "' + self.testCommand + testArgString + '" on container '+ self.prettyName).green);
    }

    var exec = self.docker.exec(reformCommand(self.testCommand + testArgString), function(err, output){
        if(err){
            console.error('\nFailed to run test command'.red);
            if(err && err.all){
                console.error(err.all.join(''));
            }
            return finishedCallback(err);
        }
        return finishedCallback(null, output);
    });

    return exec;
};


/**
 * Stop Docker container
 *
 * @param finishedCallback
 */
Container.prototype.stopContainer = function(finishedCallback) {
    var self = this;

    var stop = self.docker.stop(function(err, output){
        if(err){
            console.error(('\nCould not stop container: ' + containerId).red);
            if(err && err.all){
                console.error(err.all.join(''));
            }
            return finishedCallback(err);
        }
        if (global.config.verbose) {
            console.log('\nStopped container'.green);
        }
        return finishedCallback(null, output);
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
Container.prototype.removeContainer = function(finishedCallback) {
    var remove = this.docker.rm(function(err, output){
        if(err){
            console.error(('\nCould not remove container: ' + containerId).red);
            if(err && err.all){
                console.error(err.all.join(''));
            }
            return finishedCallback(err);
        }
        if (global.config.verbose) {
            console.log('\nRemoved container'.green);
        }

        return finishedCallback(null, output);
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
        self.docker.on('stderr', function(str){
            console.error(str);
        });
        self.docker.on('stdout', function(str){
            console.log(str);
        });
    }

    console.log(('\nTesting on container ' + self.prettyName + '').green);

    var newStep = function(stepName){
        return function(callback){
            return self[stepName](callback);
        };
    };

    var cleanup = function(testsError){
        var cleanupSteps = [
            newStep('stopContainer'),
            newStep('removeContainer'),
        ];
        async.series(cleanupSteps, function(err){
            if(testsError){
                console.error(('\nTesting on container ' + self.prettyName + ' FAILED').red);
                return finishedCallback(1);
            }
            if(err){
                console.error(('\nTesting on container ' + self.prettyName + ' FAILED').red);
                return finishedCallback(1);
            }
            console.log(('\nTesting on container ' + self.prettyName + ' SUCCESS').green);
            finishedCallback(0);
        });
    };

    var steps = [
        newStep('pullImage'),
        newStep('startAndMountContainer'),
        newStep('createWorkingCopy'),
    ];

    if (self.beforeScripts && self.beforeScripts.length) {
        steps.push(newStep('runBeforeScripts'));
    }

    steps.push(newStep('runTests'));
    return async.series(steps, cleanup);
};


exports.container = Container;
