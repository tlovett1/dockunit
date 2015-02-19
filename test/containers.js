var proxyquire = require('proxyquire');
var assert = require('assert');

var mockContainer = function() { };

/**
 * Mock the spawn dependency
 *
 * @type {container|exports.container}
 */
var Containers = proxyquire('../lib/containers', { './container': { container: mockContainer } }).containers;

/**
 * Mock config
 *
 * @type {{path: String, verbose: boolean, help: boolean, version: boolean}}
 */
global.config = {
	path: process.cwd(),
	verbose: true,
	help: false,
	version: false
};

/**
 * Mock test arguments
 *
 * @type {{}}
 */
global.testArgs = {};

var oldExit = process.exit;

describe('containers', function() {

	describe('#run()', function() {

		/**
		 * Test all successful containers
		 */
		it('Test all successful containers', function(done) {
			var json = require('./json/multiple-1.json');

			var containers = new Containers(json.containers);

			mockContainer.prototype.run = function(finishedCallback) {
				finishedCallback(0);
			};

			containers.run(function(returnCodes) {
				assert.equal(returnCodes.length, 2);
				assert.equal(returnCodes.join(''), '00');

				done();
			});
		});

		/**
		 * Test with one unsuccessful containers
		 */
		it('Test with one unsuccessful container', function(done) {
			var json = require('./json/multiple-1.json');

			var containers = new Containers(json.containers);

			var returnCode = 0;

			mockContainer.prototype.run = function(finishedCallback) {
				finishedCallback(returnCode++);
			};

			containers.run(function(returnCodes) {
				assert.equal(returnCodes.length, 2);
				assert.equal(returnCodes.join(''), '01');

				done();
			});
		});

	});

});