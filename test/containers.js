/* global describe, it */

'use strict';

var proxyquire = require('proxyquire');
var assert = require('assert');
var command = require('../lib/command');

var mockContainer = function() { };

/**
 * Mock the Container object
 */
var Containers = proxyquire('../lib/containers', { './container': { container: mockContainer } }).containers;

/**
 * Mock config
 */
command.setGlobals();

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

		/**
		 * Run one container only
		 */
		it('Run specific container', function(done) {
			var json = require('./json/multiple-1.json');

			var containers = new Containers(json.containers);

			mockContainer.prototype.run = function(finishedCallback) {
				finishedCallback(0);
			};

			containers.run(function(returnCodes) {
				assert.equal(returnCodes.length, 1);
				assert.equal(returnCodes.join(''), '0');

				done();
			}, 1);
		});

		/**
		 * Run first container only
		 */
		it('Run first container', function(done) {
			var json = require('./json/multiple-1.json');

			var containers = new Containers(json.containers);

			mockContainer.prototype.run = function(finishedCallback) {
				finishedCallback(0);
			};

			containers.run(function(returnCodes) {
				assert.equal(returnCodes.length, 1);
				assert.equal(returnCodes.join(''), '0');

				done();
			}, 0);
		});

	});

});