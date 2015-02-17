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

1. Make sure you have [NodeJS](http://nodejs.org/), [Docker](https://www.docker.com/), and [npm](https://www.npmjs.com/) install
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
      "image": "tlovett1/php-5.2-phpunit-3.5",
      "beforeScripts": [],
      "testCommand": "phpunit"
    },
    {
      "prettyName": "PHP 5.3 on Windows 8",
      "image": "tlovett1/php-5.3-windows-8",
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
dockunit <path-to-project> [--du-verbose] ...
```

* `<path-to-project>` (optional) - If you run `dockunit` in a folder with a `Dockunit.json` folder, it will detect it
automatically.
* `[--du-verbose]` (optional) - This will print out verbose Dockunit output.
* `...` - Any additional arguments and options passed to the command will be passed to your test command. For example,
if you wanted to pass a few extra options to PHPUnit, you could append them to the end of your `dockunit` command.

__*You can simply run `dockunit` in any folder with a `Dockunit.json` to run Dockunit. Simple huh?*__

## License

Dockunit is free software; you can redistribute it and/or modify it under the terms of the [GNU General
Public License](http://www.gnu.org/licenses/gpl-2.0.html) as published by the Free Software Foundation; either version
2 of the License, or (at your option) any later version.