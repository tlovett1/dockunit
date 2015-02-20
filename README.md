Dockunit [![Build Status](https://travis-ci.org/tlovett1/dockunit.svg?branch=master)](https://travis-ci.org/tlovett1/dockunit)
==========

Containerized unit testing across any platform and programming language.

## Purpose

We all want to test our applications on as many relevant platforms as possible. Sometimes this is easy.
Sometimes it's not. Dockunit let's you define a set of Docker containers to run your tests against. You can run your
test framework of choice in your language of choice on any type of environment. In the past many developers, myself
included, have relied on Travis CI to run tests in environments that aren't setup locally (i.e. PHP 5.2). With
Dockunit you don't need to do this anymore.

## Requirements

* [Node.js](http://nodejs.org/)
* [npm](https://www.npmjs.com/)
* [Docker](https://www.docker.com/)

## Installation

1. Make sure you have [Node.js](http://nodejs.org/), [Docker](https://www.docker.com/), and [npm](https://www.npmjs.com/) install
1. Install via npm:

  ```bash
  npm install -g dockunit
  ```

## Usage

Dockunit relies on `Dockunit.json` files. Each of your projects should have their own `Dockunit.json` file.
`Dockunit.json` defines what test commands should be run on what type of containers for any given project. Here is an
example `Dockunit.json`:

```javascript
{
  "containers": [
    {
      "prettyName": "PHP 5.2 on Ubuntu",
      "image": "user/my-php-image",
      "beforeScripts": [],
      "testCommand": "phpunit"
    },
    {
      "prettyName": "PHP 5.5 FPM on Ubuntu",
      "image": "user/my-php-image2",
      "beforeScripts": [],
      "testCommand": "phpunit"
    }
  ]
}
```

`containers` contains an array of container objects. Each container object can contain the following properties:

* `prettyName` (required) - This is used in output to help you identify your container.
* `image` (required) - This is a valid Docker container image located in the [Docker registry](https://registry.hub.docker.com/).
* `beforeScripts` (optional) - This is a string array of bash scripts to be run in order.
* `testCommand` (required) - This is the actual test command to be run on each container i.e. phpunit or qunit.

The Dockunit command is:

```bash
dockunit <path-to-project-directory> [--du-verbose] [--help] [--version] ...
```

_Note:_ `sudo` is usually required when run within a Linux distribution since Dockunit runs Docker commands which require special permissions.

* `<path-to-project-directory>` (optional) - If you run `dockunit` in a folder with a `Dockunit.json` folder, it will detect it
automatically.
* `[--du-verbose]` (optional) - This will print out verbose Dockunit output.
* `[--help]` (optional) - This will display usage information for the `dockunit` command.
* `[--version]` (optional) - This will display the current installed version of Dockunit.
* `...` - Any additional arguments and options passed to the command will be passed to your test command. For example,
if you wanted to pass a few extra options to PHPUnit, you could append them to the end of your `dockunit` command.

__*You can simply run `dockunit` in any folder with a `Dockunit.json` to run Dockunit.*__

### Dockunit and WordPress

Dockunit and WordPress work well together. WordPress is backwards compatible with PHP 5.2. It's very difficult to test
applications on PHP 5.2 without some sort of containerized workflow. Here is an example `Dockunit.json` file that you
can use to test your WordPress themes and plugins in PHP 5.2 and 5.5:

```javascript
{
  "containers": [
    {
      "prettyName": "PHP 5.2 FPM WordPress 4.1",
      "image": "tlovett1/php-5.2-phpunit-3.5",
      "beforeScripts": [
        "service mysql start",
        "bash bin/install-wp-tests.sh wordpress_test root '' localhost 4.1"
      ],
      "testCommand": "phpunit"
    },
    {
      "prettyName": "PHP 5.5 FPM WordPress 4.0",
      "image": "tlovett1/php-fpm-phpunit-wp",
      "beforeScripts": [
        "service mysql start",
        "bash bin/install-wp-tests.sh wordpress_test2 root '' localhost 4.0"
      ],
      "testCommand": "phpunit"
    },
    {
      "prettyName": "PHP 5.5 for Apache WordPress 3.9",
      "image": "tlovett1/php-apache-phpunit-wp",
      "beforeScripts": [
        "service mysql start",
        "bash bin/install-wp-tests.sh wordpress_test3 root '' localhost 3.9"
      ],
      "testCommand": "phpunit"
    }
  ]
}
```

[tlovett1/php-5.2-phpunit-3.5](https://registry.hub.docker.com/u/tlovett1/php-5.2-phpunit-3.5/) and [tlovett1/php-fpm-phpunit-wp](https://registry.hub.docker.com/u/tlovett1/php-fpm-phpunit-wp/) are valid Docker images available for use in `Dockerfile.json`.

### Dockunit and Node.js
It is super easy to test your Node.js applications with Dockunit. Here is a simple `Dockunit.json` file that tests
an application in Node.js 0.10.x and 0.12.0 using [mocha](http://mochajs.org/):

```javascript
{
  "containers": [
    {
      "prettyName": "Node 0.10.x",
      "image": "google/nodejs:latest",
      "beforeScripts": [
        "npm install -g mocha"
      ],
      "testCommand": "mocha"
    },
    {
      "prettyName": "Node 0.12",
      "image": "tlovett1/nodejs:0.12",
      "beforeScripts": [
        "npm install -g mocha"
      ],
      "testCommand": "mocha"
    }
  ]
}
```

## License

Dockunit is free software; you can redistribute it and/or modify it under the terms of the [GNU General
Public License](http://www.gnu.org/licenses/gpl-2.0.html) as published by the Free Software Foundation; either version
2 of the License, or (at your option) any later version.