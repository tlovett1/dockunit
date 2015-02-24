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
Containers.prototype.run = function(finishedCallback, containerId) {
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

	if (typeof containerId !== 'undefined' && false !== containerId) {
		self.containers[containerId].run(function(code) {
			returnCodes.push(code);
			finishedCallback(returnCodes);
		});
	} else {
		self.containers[i].run(callback);
	}
};


exports.containers = Containers;