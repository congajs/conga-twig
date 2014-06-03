conga-twig
==========

Overview
--------

This is a bundle for the [Conga.js](https://github.com/congajs/conga) framework which 
integrates the [twig.js Template Engine](https://github.com/justjohn/twig.js) into a project.

Configuration
-------------

Example:

    // config.yml
    twig:

        options:
        	strict_variables: false

Usage
-----

For general information about TwigJS, please see the document for the [twig.js Template Engine](https://github.com/justjohn/twig.js).

conga-twig loads views by default from *.html.twig files.  The suffix may be omitted from your includes and extends statements.

Extending Templates:

	{% extends "bundle-name:path/to/file" %}

AND

	{% extends "bundle-name:path/to/file.html.twig" %}

Extend the same file, at root/src/bundle-name/lib/resources/views/path/to/file.html.twig

Including Templates:

	{% include "bundle-name:path/to/file" %}

AND

	{% include "bundle-name:path/to/file.html.twig" %}

Include the same file, at root/src/bundle-name/lib/resources/views/path/to/file.html.twig

Overloading Blocks:

Consider a layout file that defines your HTML Structure possibly located at, root/src/bundle-name/lib/resources/views/layout.html.twig

	<!DOCTYPE html>
	<html>
		<head>
			<title>{{ title | default("Untitled Document") }}</title>

			{% block stylesheets %}{% endblock %}

			{% block javascripts %}{% endblock %}
		</head>
		<body>
			{% block content %}
				<h1>This is default text in my block!</h1>
			{% endblock %}
		</body>
	</html>

Consider extending this file with your controller action's view located at, root/src/bundle-name/lib/resources/views/Default/index.html.twig

	{% extends "bundle-name:layout" %}

	{% set title = "This is my title" %}

	{% block stylesheets %}

		{% assets "/css/all.css", "css", [
			"/css/lib/something.css",
			"/bundles/some-bundle/css/*"
		] %}

			<link rel="stylesheet" href="{{ url }}" />

		{% endassets %}

	{% endblock %}

	{% block content %}
		<h1>This text overloads the default text in my original block</h1>
	{% endblock %}

Built-In Tags:

Assets {% assets %} allows you to interact with conga-assets from within twig.  In the development environment, all files will be printed one by one, but in production or test only the single roll up file will be printed.  The syntax is as follows:

	{% assets "/rollup/file", "file_type", ["list", "of", "files"] %}
		For each file being returned, this data is parsed for you.
		You have access to each URL as {{ url }}
	{% endassets %}

The allowed file types are

	javascript
	css

Custom tags are available for you to define through the service container.

    # services.yml - My Custom Tag
    custom.twig.tag:
        constructor: "my-bundle:custom/twig/tag"
        arguments: []
        tags:
            - { name: twig.tag, method: registerTag }



	# /custom/twig/tag.js
	function CustomTwigTag() { }

	CustomTwigTag.prototype.registerTag = function(container, Twig) {

		Twig.registerTag({
			/* ... your logic ... */
		});

	};

	module.exports = CustomTwigTag;

For more information about registering custom tags, see [Extending TwigJS With Custom Tags](https://github.com/justjohn/twig.js/wiki/Extending-twig.js-With-Custom-Tags)