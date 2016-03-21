'use strict';

var Container = require('./container').container;
var async = require('async');

/**
 * Initialize new containers object
 *
 * @param containersArray
 * @constructor
 */
var Containers = function(options, containersArray) {
    if(Array.isArray(options)){
        containersArray = options;
        options = {};
    }
    this.containerLimit = options.containerLimit || 2;
    this.containers = containersArray.map(function(config){
        return new Container(config);
    });
/*
    this.containers = [];

    for (var i = 0; i < containersArray.length; i++) {
        this.containers.push(new Container(containersArray[i]));
    }
*/
};

/**
 * Run all containers
 */
Containers.prototype.run = function(finishedCallback, containerId) {
    var self = this,
        returnCodes = [];
/*
    var i = 0,
        self = this,
        returnCodes = [];

    function callback(code) {
        i++;

        returnCodes.push(code);

        if (i < self.containers.length) {
            self.containers[i].run(callback);
        } else {
            finishedCallback(returnCodes);
        }
    }
    */
    var runContainer = function(container, next){
        container.run(function(code){
            returnCodes.push(code);
            next();
        });
    };
    var done = function(){
        finishedCallback(returnCodes);
    };

    if (typeof containerId !== 'undefined' && false !== containerId) {
        self.containers[containerId].run(function(code) {
            returnCodes.push(code);
            finishedCallback(returnCodes);
        });
        return self;
    /*} else {
        self.containers[i].run(callback);*/
    }
    async.eachLimit(self.containers, this.containerLimit, runContainer, done);
    return self;
};


exports.containers = Containers;
