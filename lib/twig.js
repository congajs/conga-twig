/*
 * This file is part of the conga-twig module.
 *
 * (c) Anthony Matarazzo <email@anthonymatarazzo.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

// built-in modules
var fs = require('fs');
var path = require('path');

// third party modules
var TwigJS = require('twig');

/**
 * Our conga-twig module class
 * @constructor
 */
function Twig() { }

/**
 * Configure TwigJS and register it within express
 *
 * @param {Container} container
 * @param {Application} app
 * @param {Function} next
 * @returns {void}
 */
Twig.prototype.onConfigureViewEngine = function(container, app, next){

	var config = container.get('config').get('twig');

	// override twig's renderFile to deal with namespaced template names
	// for 'extends' and 'include'
	// hopefully this never breaks in future versions!!!
	TwigJS.extend(function(TwigJS) {

		var regSuffix = /\.html\.twig$/i;

		var loadRemote = TwigJS.Templates.loadRemote;
		TwigJS.Templates.loadRemote = function(location, params, callback, error_callback) {

			var parts = location.split(':');
			if (parts.length !== 2) {

				// not a namespace path - pass it through
				return loadRemote.apply(this, arguments);

			}

			// private relativePath function in Twig.core.js cannot be overloaded
			// this function alters the location before it is passed into the loadRemote (in various places)
			// we need to format the location back into a valid namespace path
			// foo/bar/my-bundle:path/to/file ==> my-bundle:path/to/file

			var suffix = parts[0].split('/').pop();	// my-bundle
			var prefix = parts[1];					// path/to/file

			// my-bundle:path/to/file
			var namespace = suffix + ':' + prefix;

			// append the extension to the namespace path
			if (!regSuffix.test(namespace)) {
				namespace += '.html.twig';
			}

			// resolve the path
			location = container.get('namespace.resolver').resolveWithSubpath(namespace, 'lib/resources/views');

			// call original method
			var args = Array.prototype.slice.call(arguments, 1).unshift(location);
			return loadRemote.apply(this, args);
		};
	});

	// hook up twig.js with express
	app.engine('twig', TwigJS.__express);

	// copy over options
	for (var i in config.options){
		app.locals[i] = config.options[i];
	}

	// set twig on the container so that other bundles can access it if they want
	container.set('twig', TwigJS);

	// setting this here for now - set the file extension used for all twig files
	container.setParameter('app.view.engine', 'html.twig');

	// add error templates
	container.getParameter('conga.templates')['exception'] = {
		'error404': { namespace : 'conga-twig:exception/error404' },
		'error500': { namespace : 'conga-twig:exception/error500' }
	};

	next();
};

module.exports = Twig;