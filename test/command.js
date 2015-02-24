/* global describe, it */

'use strict';

var proxyquire = require('proxyquire');
var assert = require('assert');

var mockContainer = function() { };
/**
 * Mock the Containers object
 */
var Command = proxyquire('../lib/command', { './container': { container: mockContainer } });

describe('command', function() {

	describe('#processArgs()', function() {

		/**
		 * Simple dockunit call with no arguments
		 */
		it('Test no special args', function() {
			Command.setGlobals();

			var argv = {
				_: []
			};

			Command.processArgs(argv);

			assert.equal(global.config.path, process.cwd());
			assert.equal(global.config.verbose, false);
			assert.equal(global.config.help, false);
			assert.equal(global.config.container, false);
			assert.equal(Object.keys(global.testArgs).length, 1);
		});

		/**
		 * Set a custom path
		 */
		it('Test custom path', function() {
			Command.setGlobals();

			var argv = {
				_: ['path']
			};

			Command.processArgs(argv);

			assert.equal(global.config.path, 'path');
			assert.equal(global.config.verbose, false);
			assert.equal(global.config.help, false);
			assert.equal(global.config.container, false);
			assert.equal(Object.keys(global.testArgs).length, 1);
			assert.equal(global.testArgs._.length, 0);
		});

		/**
		 * Set a simple command to be verbose
		 */
		it('Test verbose command', function() {
			Command.setGlobals();

			var argv = {
				_: [],
				'du-verbose': true
			};

			Command.processArgs(argv);

			assert.equal(global.config.path, process.cwd());
			assert.equal(global.config.verbose, true);
			assert.equal(global.config.help, false);
			assert.equal(global.config.container, false);
			assert.equal(Object.keys(global.testArgs).length, 1);
			assert.equal(global.testArgs._.length, 0);
		});

		/**
		 * Pass just a simple option to the test command
		 */
		it('Test pass argument to test command', function() {
			Command.setGlobals();

			var argv = {
				_: [],
				special: 'test'
			};

			Command.processArgs(argv);

			assert.equal(global.config.path, process.cwd());
			assert.equal(global.config.verbose, false);
			assert.equal(global.config.help, false);
			assert.equal(global.config.container, false);
			assert.equal(Object.keys(global.testArgs).length, 2);
			assert.equal(global.testArgs.special, 'test');
			assert.equal(global.testArgs._.length, 0);
		});

		/**
		 * Test running a specific container with the --du-container option
		 */
		it('Test good container option', function() {
			Command.setGlobals();

			var argv = {
				_: [],
				special: 'test',
				'du-container': 2
			};

			Command.processArgs(argv);

			assert.equal(global.config.path, process.cwd());
			assert.equal(global.config.verbose, false);
			assert.equal(global.config.help, false);
			assert.equal(global.config.container, 2);
			assert.equal(Object.keys(global.testArgs).length, 2);
			assert.equal(global.testArgs.special, 'test');
			assert.equal(global.testArgs._.length, 0);
		});

		/**
		 * Test 0 as container option
		 */
		it('Test 0 as container option', function() {
			Command.setGlobals();

			var argv = {
				_: [],
				special: 'test',
				'du-container': 0
			};

			Command.processArgs(argv);

			assert.equal(global.config.path, process.cwd());
			assert.equal(global.config.verbose, false);
			assert.equal(global.config.help, false);
			assert.equal(global.config.container, 0);
			assert.equal(Object.keys(global.testArgs).length, 2);
			assert.equal(global.testArgs.special, 'test');
			assert.equal(global.testArgs._.length, 0);
		});

		/**
		 * Test a bad container option value
		 */
		it('Test bad container option', function() {
			Command.setGlobals();

			var argv = {
				_: [],
				special: 'test',
				'du-container': 'sdfsdf'
			};

			Command.processArgs(argv);

			assert.equal(global.config.path, process.cwd());
			assert.equal(global.config.verbose, false);
			assert.equal(global.config.help, false);
			assert.equal(global.config.container, false);
			assert.equal(Object.keys(global.testArgs).length, 2);
			assert.equal(global.testArgs.special, 'test');
			assert.equal(global.testArgs._.length, 0);
		});

		/**
		 * Pass a path as well as a test arg. Set to verbose and pass two options to the test command.
		 */
		it('Test complex command', function() {
			Command.setGlobals();

			var argv = {
				_: ['path', 'test-arg'],
				special: 'test',
				'du-verbose': true,
				special2: true
			};

			Command.processArgs(argv);

			assert.equal(global.config.path, 'path');
			assert.equal(global.config.verbose, true);
			assert.equal(global.config.help, false);
			assert.equal(global.config.container, false);
			assert.equal(Object.keys(global.testArgs).length, 3);
			assert.equal(global.testArgs.special, 'test');
			assert.equal(global.testArgs.special2, true);
			assert.equal(global.testArgs._.length, 1);
		});
	});

});