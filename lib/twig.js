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
var async = require('async');

/**
 * Our conga-twig module class
 * @constructor
 */
function Twig() { }

/**
 * The service container
 * @type {Container|null}
 */
Twig.prototype.container = null;

/**
 * Respond to the kernel-compile event
 * @param {Object} event The object passed to this event
 * @param {Function} cb The callback to execute when finished
 */
Twig.prototype.onKernelCompile = function(event, cb) {

	// register user defined token events
	this._registerCustomExtensions(event.container, 'tag');
	this._registerCustomExtensions(event.container, 'filter');
	this._registerCustomExtensions(event.container, 'function');

	// set twig on the container so that other bundles can access it if they want
	event.container.set('twig', TwigJS);

	// call the on-initialize event for other services to hook into conga-twig
	this.onInitialize(event, cb);

};

/**
 * When twig initializes, execute twig.initialize tags so other services can hook into conga-twig
 * @param {Object} event The object passed to this event
 * @param {Function} next The callback to execute when finished
 */
Twig.prototype.onInitialize = function(event, next) {

	var nodes = event.container.getTagsByName('twig.initialize');

	if (!nodes) {
		next();
		return;
	}

	// sort the nodes by priority
	event.container.get('conga.ioc.tag.sorter').sortByPriority(nodes);

	TwigJS.extend(function(TwigJS) {

		var calls = [];

		// execute the twig.initialize events
		nodes.forEach(function(node) {
			var service = event.container.get(node.getServiceId());
			if (service) {
				var method = node.getParameter('method');
				if (method && typeof service[method] === 'function') {
					calls.push(function(cb) {
						service[node.getParameter('method')](event.container, TwigJS, function(err) {
							cb(err);
						});
					});
				}
			}
		});

		if (calls.length !== 0) {
			async.series(calls, function(err) {
				if (err) {
					event.container.get('logger').debug(err.stack || err);
				}
				next();
			});
		} else {
			next();
		}

	});

};

/**
 * Handle middleware configurations
 * @param {Container|*} container
 * @param {Object} app
 * @param {Function} next
 */
Twig.prototype.onAddMiddleware = function(container, app, next) {

	this.container = container;

	next();
};

/**
 * Register custom twig extensions (tags, filters, functions)
 * @param {Container|*} container
 * @param {String} extensionType The type of extension to register: tag, filter, function
 * @private
 */
Twig.prototype._registerCustomExtensions = function(container, extensionType) {
	var nodes = container.getTagsByName('twig.' + extensionType);

	if (!nodes) {
		return;
	}

	// sort the nodes by priority
	container.get('conga.ioc.tag.sorter').sortByPriority(nodes);

	TwigJS.extend(function(TwigJS) {

		// register the twig tags
		nodes.forEach(function(node) {
			var service = container.get(node.getServiceId());
			if (service) {
				var method = node.getParameter('method');
				if (method && typeof service[method] === 'function') {

					service[node.getParameter('method')](container, TwigJS);

				} else if (typeof service.register === 'function') {

					service.register(container, TwigJS);

				}
			}
		});
	});
};

/**
 * Configure TwigJS and register it within express
 *
 * @param {Container} container
 * @param {Application} app
 * @param {Function} next
 * @returns {void}
 */
Twig.prototype.onConfigureViewEngine = function(container, app, next){

	this.container = container;

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
			return loadRemote.apply(this, [location, params, callback, error_callback]);
		};
	});

	// hook up twig.js with express
	app.engine('twig', TwigJS.__express);

	// copy over options
	for (var i in config.options){
		app.locals[i] = config.options[i];
	}

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