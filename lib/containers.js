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
		self = this,
		returnCodes = [];

	function callback(code) {
		i++;

		returnCodes.push(code);

		if (i < self.containers.length) {
			self.containers[i].run(callback);
		} else {
			finish();
		}
	}

	function finish() {
		var errors = 0;

		for (var i = 0; i < returnCodes.length; i++) {
			if (returnCodes[i] !== 0) {
				errors++;
			}
		}

		if (!returnCodes.length) {
			console.log(('\nNo containers finished').bgYellow + '\n');
		} else {
			if (!errors) {
				console.log(('\n' + self.containers.length + ' containers passed').bgGreen + '\n');
			} else {
				console.error(('\n' + errors + ' out of ' + self.containers.length + ' containers passed').bgRed + '\n');
			}
		}
	}

	self.containers[i].run(callback);
};


exports.containers = Containers;