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
	var i = 0,
		self = this;

	self.containers[i].run(callback);

	function callback() {
		i++;

		if (i < self.containers.length) {
			self.containers[i].run(callback);
		} else {
			finish();
		}
	}

	function finish() {
		console.log('\nAll containers finished'.bgGreen + '\n');
	}
};


exports.containers = Containers;