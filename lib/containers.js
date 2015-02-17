'use strict';

var Container = require( './container').container;

/**
 * Initialize new containers object
 *
 * @param containersArray
 * @constructor
 */
var Containers = function(containersArray) {
	this.containers = [];

	for (var i = 0; i < containersArray.length; i++) {
		this.containers.push(new Container(containersArray[i]));
	}
};

/**
 * Run all containers
 */
Containers.prototype.run = function() {
	for (var i = 0; i < this.containers.length; i++) {
		this.containers[i].run();
	}
};


exports.containers = Containers;