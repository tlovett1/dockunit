Dockunit [![Dockunit Status](https://dockunit.io/svg/dockunit/dockunit?master)](https://dockunit.io/projects/dockunit/dockunit#master)
==========

Containerized unit testing across any platform and programming language.

## Purpose

We all want to test our applications on as many relevant platforms as possible. Sometimes this is easy.
Sometimes it's not. Dockunit let's you define a set of Docker containers to run your tests against. You can run your
test framework of choice in your language of choice on any type of environment. In the past many developers, myself
included, have relied on Travis CI to run tests in environments that aren't setup locally (i.e. PHP 5.2). With
Dockunit you don't need to do this anymore.

## Requirements

* OSX or a Linux Distribution (Windows not yet tested or officially supported)
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
      "prettyName": "PHP 5.6 FPM on Ubuntu",
      "image": "user/my-php-image2",
      "beforeScripts": [],
      "testCommand": "phpunit"
    }
  ]
}
```

`containers` contains an array of container objects. Each container object can contain the following properties:

* `prettyName` (required) - This is used in output to help you identify your container.
* `image` (required) - This is a valid Docker container image located in the [Docker registry](https://registry.hub.docker.com/). We have a number of handy [prebuilt Docker images](https://github.com/dockunit/docker-prebuilt) for use in your `Dockunit.json` files.
* `beforeScripts` (optional) - This is a string array of bash scripts to be run in order.
* `testCommand` (required) - This is the actual test command to be run on each container i.e. phpunit or qunit.

The Dockunit command is:

```bash
dockunit <path-to-project-directory> [--du-verbose] [--du-container] [--help] [--version] ...
```

_Note:_ `sudo` is usually required when run within a Linux distribution since Dockunit runs Docker commands which require special permissions.

* `<path-to-project-directory>` (optional) - If you run `dockunit` in a folder with a `Dockunit.json` folder, it will detect it
automatically.
* `[--du-verbose]` (optional) - This will print out verbose Dockunit output.
* `[--du-container]` (optional) - Run only one container in your `Dockunit.json` file by specifying the index of that container in the `containers` array .i.e `--du-container=1`.
* `[--help]` (optional) - This will display usage information for the `dockunit` command.
* `[--version]` (optional) - This will display the current installed version of Dockunit.
* `...` - Any additional arguments and options passed to the command will be passed to your test command. For example,
if you wanted to pass a few extra options to PHPUnit, you could append them to the end of your `dockunit` command.

__*You can simply run `dockunit` in any folder with a `Dockunit.json` to run Dockunit.*__

## Dockunit.json Examples

Each of your projects should have a `Dockunit.json` file in the project root. You should define your containers to fit
your application's unique needs. Here's a few example `Dockunit.json` files for a variety of different programming languages and
environments. Feel free to use any of our [prebuilt Docker images](https://hub.docker.com/r/dockunit/prebuilt-images/) in your `Dockunit.json` files or create your own.

### PHP and WordPress

Dockunit and WordPress work well together. WordPress is backwards compatible with PHP 5.2. It's very difficult to test
applications on PHP 5.2 without some sort of containerized workflow. Here is an example `Dockunit.json` file that you
can use to test your WordPress plugins in PHP 5.2, 5.6, and PHP 7.0 RC 1 (make sure to replace `PLUGIN-FILE.php` with your plugins main file):

```javascript
{
  "containers": [
    {
      "prettyName": "PHP-FPM 5.2 WordPress Latest",
      "image": "dockunit/prebuilt-images:php-mysql-phpunit-wordpress-5.2-fpm",
      "beforeScripts": [
        "service mysql start",
        "wp-install latest"
      ],
      "testCommand": "wp-activate-plugin PLUGIN-FILE.php"
    },
    {
      "prettyName": "PHP-FPM 5.6 WordPress Latest",
      "image": "dockunit/prebuilt-images:php-mysql-phpunit-wordpress-5.6-fpm",
      "beforeScripts": [
        "service mysql start",
        "wp core download --path=/temp/wp --allow-root",
        "wp core config --path=/temp/wp --dbname=test --dbuser=root --allow-root",
        "wp core install --url=http://localhost --title=Test --admin_user=admin --admin_password=12345 --admin_email=test@test.com --path=/temp/wp --allow-root",
        "mkdir /temp/wp/wp-content/plugins/test",
        "cp -r . /temp/wp/wp-content/plugins/test"
      ],
      "testCommand": "wp plugin activate test --allow-root --path=/temp/wp"
    },
    {
      "prettyName": "PHP-FPM 7.0 WordPress Latest",
      "image": "dockunit/prebuilt-images:php-mysql-phpunit-wordpress-7.0-rc-1-fpm",
      "beforeScripts": [
        "service mysql start",
        "wp core download --path=/temp/wp --allow-root",
        "wp core config --path=/temp/wp --dbname=test --dbuser=root --allow-root",
        "wp core install --url=http://localhost --title=Test --admin_user=admin --admin_password=12345 --admin_email=test@test.com --path=/temp/wp --allow-root",
        "mkdir /temp/wp/wp-content/plugins/test",
        "cp -r . /temp/wp/wp-content/plugins/test"
      ],
      "testCommand": "wp plugin activate test --allow-root --path=/temp/wp"
    }
  ]
}
```

Here is an example `Dockunit.json` file that you can use to test your WordPress themes in PHP 5.2, 5.6, and PHP 7.0 RC 1:

```javascript
{
  "containers": [
    {
      "prettyName": "PHP-FPM 5.2 WordPress Latest",
      "image": "dockunit/prebuilt-images:php-mysql-phpunit-wordpress-5.2-fpm",
      "beforeScripts": [
        "service mysql start",
        "wp-install latest"
      ],
      "testCommand": "wp-activate-theme test"
    },
    {
      "prettyName": "PHP-FPM 5.6 WordPress Latest",
      "image": "dockunit/prebuilt-images:php-mysql-phpunit-wordpress-5.6-fpm",
      "beforeScripts": [
        "service mysql start",
        "wp core download --path=/temp/wp --allow-root",
        "wp core config --path=/temp/wp --dbname=test --dbuser=root --allow-root",
        "wp core install --url=http://localhost --title=Test --admin_user=admin --admin_password=12345 --admin_email=test@test.com --path=/temp/wp --allow-root",
        "mkdir /temp/wp/wp-content/themes/test",
        "cp -r . /temp/wp/wp-content/themes/test"
      ],
      "testCommand": "wp theme activate test --allow-root --path=/temp/wp"
    },
    {
      "prettyName": "PHP-FPM 7.0 WordPress Latest",
      "image": "dockunit/prebuilt-images:php-mysql-phpunit-wordpress-7.0-rc-1-fpm",
      "beforeScripts": [
        "service mysql start",
        "wp core download --path=/temp/wp --allow-root",
        "wp core config --path=/temp/wp --dbname=test --dbuser=root --allow-root",
        "wp core install --url=http://localhost --title=Test --admin_user=admin --admin_password=12345 --admin_email=test@test.com --path=/temp/wp --allow-root",
        "mkdir /temp/wp/wp-content/themes/test",
        "cp -r . /temp/wp/wp-content/themes/test"
      ],
      "testCommand": "wp theme activate test --allow-root --path=/temp/wp"
    }
  ]
}
```

### PHP and WordPress Unit Tests

Here are some more advanced WordPress examples. That assume you have unit tests setup via [WP-CLI](https://github.com/wp-cli/wp-cli/wiki/Plugin-Unit-Tests).

```javascript
{
  "containers": [
    {
      "prettyName": "PHP 5.2 FPM WordPress 4.1",
      "image": "dockunit/prebuilt-images:php-mysql-phpunit-5.2-fpm",
      "beforeScripts": [
        "service mysql start",
        "bash bin/install-wp-tests.sh wordpress_test root '' localhost 4.1"
      ],
      "testCommand": "phpunit"
    },
    {
      "prettyName": "PHP 5.6 FPM WordPress 4.0",
      "image": "dockunit/prebuilt-images:php-mysql-phpunit-5.6-fpm",
      "beforeScripts": [
        "service mysql start",
        "bash bin/install-wp-tests.sh wordpress_test2 root '' localhost 4.0"
      ],
      "testCommand": "phpunit"
    },
    {
      "prettyName": "PHP 7.0 RC-1",
      "image": "dockunit/prebuilt-images:php-mysql-phpunit-7.0-rc-1-fpm",
      "beforeScripts": [
        "service mysql start",
        "bash bin/install-wp-tests.sh wordpress_test3 root '' localhost 3.9"
      ],
      "testCommand": "phpunit"
    }
  ]
}
```

[dockunit/prebuilt-images:php-mysql-phpunit-5.6-fpm](https://hub.docker.com/r/dockunit/prebuilt-images/), [dockunit/prebuilt-images:php-mysql-phpunit-5.6-fpm](https://hub.docker.com/r/dockunit/prebuilt-images), and [dockunit/prebuilt-images:php-mysql-phpunit-7.0-rc-1-fpm](https://hub.docker.com/r/dockunit/prebuilt-images) are valid Docker images available for use in any `Dockerfile.json`.

### Node.js

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

[google/nodejs](https://registry.hub.docker.com/u/google/nodejs/) is a valid Docker image available for use in any `Dockerfile.json`.

### Python

Dockunit works great with Python. This `Dockunit.json` file tests in Python 2.7.9 and the latest Python version using [nose](https://nose.readthedocs.org/en/latest/):

```javascript
{
  "containers": [
    {
      "prettyName": "Python 2.7.9",
      "image": "python:2.7.9",
      "beforeScripts": [
        "easy_install nose"
      ],
      "testCommand": "nosetests tests"
    },
    {
      "prettyName": "Python Latest",
      "image": "python:latest",
      "beforeScripts": [
        "easy_install nose"
      ],
      "testCommand": "nosetests tests"
    }
  ]
}
```

### Ruby

You can use Dockunit to test your Ruby scripts. This `Dockunit.json` file tests a project in Ruby 2.1 and the latest
stable Ruby version using [test-unit](https://rubygems.org/gems/test-unit):

```javascript
{
  "containers": [
    {
      "prettyName": "Latest version of Ruby",
      "image": "ruby:latest",
      "beforeScripts": [
        "bundle install"
      ],
      "testCommand": "bundle exec rake test"
    },
    {
      "prettyName": "Ruby version 2.1",
      "image": "ruby:2.1",
      "beforeScripts": [
        "bundle install"
      ],
      "testCommand": "bundle exec rake test"
    }
  ]
}
```

[ruby](https://registry.hub.docker.com/_/ruby/) is a valid Docker image available for use in any `Dockerfile.json`.

## License

Dockunit is free software; you can redistribute it and/or modify it under the terms of the [GNU General
Public License](http://www.gnu.org/licenses/gpl-2.0.html) as published by the Free Software Foundation; either version
2 of the License, or (at your option) any later version.