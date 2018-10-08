/* global describe, it */

'use strict';

var proxyquire = require('proxyquire');
var assert = require('assert');
var mockSpawn = require('mock-spawn');
var command = require('../lib/command');

var mySpawn = mockSpawn();

/**
 * Mock the spawn dependency
 *
 * @type {container|exports.container}
 */
var Container = proxyquire('../lib/container', { child_process: { spawn: mySpawn } });

/**
 * Mock config
 */
command.setGlobals();

var oldExit = process.exit;

describe('container', () => {

	describe('#pullImage()', () => {

		/**
		 * Test a simple successful Docker image pull
		 */
		it('Test successful Docker image pull', (done) => {
			var json = require('./json/simple-1.json').containers[0];

			var container = new Container(json);

			mySpawn.setDefault(mySpawn.simple(0));

			container.pullImage().then(() => done());
		});

		/**
		 * Test a simple unsuccessful Docker pull
		 */
		it('Test unsuccessful Docker image pull', (done) => {
			var json = require('./json/simple-1.json').containers[0];

			var container = new Container(json);

			mySpawn.setDefault(mySpawn.simple(1));

			container.pullImage().catch(() => done());
		});
	});
	
	describe('#startContainer()', () => {

		/**
		 * Test a simple successful Docker image pull
		 */
		it('Test successful Docker start', (done) => {
			var json = require('./json/simple-1.json').containers[0];

			var container = new Container(json);

			mySpawn.setDefault(mySpawn.simple(0, '24fdgw543ys25'));

			container.startAndMountContainer().then(() => done());
		});

		/**
		 * Test an unsuccessful Docker start where no container ID is provided
		 */
		it('Test unsuccessful Docker start where no container ID is provided', (done) => {
			var json = require('./json/simple-1.json').containers[0];

			var container = new Container(json);

			mySpawn.setDefault(mySpawn.simple(0));

			container.startAndMountContainer().catch(() => done());
		});

		/**
		 * Test an unsuccessful Docker start where no container ID is provided
		 */
		it('Test unsuccessful Docker start the command errored', (done) => {
			var json = require('./json/simple-1.json').containers[0];

			var container = new Container(json);

			mySpawn.setDefault(mySpawn.simple(1));

			container.startAndMountContainer().catch(() => done());
		});
	});

	describe('#stopContainer()', () => {

		/**
		 * Test a simple successful Docker container stop
		 */
		it('Test successful Docker container stop', (done) => {
			var json = require('./json/simple-1.json').containers[0];

			var container = new Container(json);

			mySpawn.setDefault(mySpawn.simple(0));

			container.stopContainer('e534rwdfs').then(() => done());
		});

		/**
		 * Test a simple unsuccessful Docker container stop
		 */
		it('Test unsuccessful Docker container stop', (done) => {
			var json = require('./json/simple-1.json').containers[0];

			var container = new Container(json);

			mySpawn.setDefault(mySpawn.simple(1));

			container.stopContainer('e534rwdfs').catch(() => done());
		});
	});

	describe('#runBeforeScript()', () => {

		/**
		 * Test a simple successful before script
		 */
		it('Test successful before script', (done) => {
			var json = require('./json/simple-1.json').containers[0];

			var container = new Container(json);

			mySpawn.setDefault(mySpawn.simple(0));

			container.runBeforeScript('e534rwdfs', json.beforeScripts[0]).then(() => done());
		});

		/**
		 * Test a simple unsuccessful before script
		 */
		it('Test unsuccessful before script', (done) => {
			var json = require('./json/simple-1.json').containers[0];

			var container = new Container(json);

			mySpawn.setDefault(mySpawn.simple(1));

			container.runBeforeScript('e534rwdfs', json.beforeScripts[0]).catch(() => done());
		});
	});

	describe('#runTests()', () => {

		/**
		 * Test a simple passed tests
		 */
		it('Test passed tests', (done) => {
			var json = require('./json/simple-1.json').containers[0];

			var container = new Container(json);

			mySpawn.setDefault(mySpawn.simple(0));

			container.runBeforeScript('e534rwdfs', json.beforeScripts[0]).then(() => done());
		});

		/**
		 * Test a simple failed tests
		 */
		it('Test failed tests', (done) => {
			var json = require('./json/simple-1.json').containers[0];

			var container = new Container(json);

			mySpawn.setDefault(mySpawn.simple(0));

			container.runTests('e534rwdfs').then(() => done());
		});

		/**
		 * Test a simple test error
		 */
		it('Test test error', (done) => {
			var json = require('./json/simple-1.json').containers[0];

			var container = new Container(json);

			mySpawn.setDefault(mySpawn.simple(255));

			container.runTests('e534rwdfs').catch(() => done());
		});
	});
});
