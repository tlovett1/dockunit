'use strict';

var Container = require('./container').container;

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
Containers.prototype.run = function(finishedCallback) {
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

	self.containers[i].run(callback);
};


exports.containers = Containers;