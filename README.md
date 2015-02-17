Dockunit
==========

Run containerized language agnostic unit tests.

## Purpose

We all want to test our applications on as many relevant platforms as possible. Sometimes this is easy.
Sometimes it's not. Dockunit let's you define a set of Docker containers to run your tests against. You can run your
test framework of choice in your language of choice on any type of environment. In the past many developers, myself
included, have relied on Travis CI to run tests in environments that aren't setup locally (i.e. PHP 5.2). With
Dockunit you don't need to do this anymore.

## Requirements

* [NodeJS](http://nodejs.org/)
* [npm](https://www.npmjs.com/)
* [Docker](https://www.docker.com/)

## Installation

Install via npm