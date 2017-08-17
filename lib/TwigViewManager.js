/*
 * This file is part of the conga-twig module.
 *
 * (c) Anthony Matarazzo <email@anthonymatarazzo.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

// built-in modules
const fs = require('fs');
const path = require('path');

// third party modules
const TwigJS = require('twig');
const async = require('async');

// local modules
const TwigViewEngine = require('./TwigViewEngine');

/**
 * Our conga-twig module class
 * @constructor
 */
module.exports = class TwigViewManager {

	/**
	 * Respond to the kernel-compile event
	 * @param  {Object}   event The object passed to this event
	 * @param  {Function} cb The callback to execute when finished
	 * @return {void}
	 */
	onKernelCompile(event, cb) {

		event.container.get('logger').debug('[conga-twig] - setting up twig.js');

		// register user defined token events
		this._registerCustomExtensions(event.container, 'tag');
		this._registerCustomExtensions(event.container, 'filter');
		this._registerCustomExtensions(event.container, 'function');

		// set twig on the container so that other bundles can access it if they want
		event.container.set('twig', TwigJS);

		// call the on-initialize event for other services to hook into conga-twig
		this.onInitialize(event, cb);

	}

	/**
	 * When twig initializes, execute twig.initialize tags so other services can hook into conga-twig
	 * @param  {Object}   event The object passed to this event
	 * @param  {Function} next The callback to execute when finished
	 * @return {void}
	 */
	onInitialize(event, next) {

		const nodes = event.container.getTagsByName('twig.initialize');

		if (!nodes) {
			next();
			return;
		}

		// sort the nodes by priority
		event.container.get('conga.ioc.tag.sorter').sortByPriority(nodes);

		TwigJS.extend(function(TwigJS) {

			const calls = [];

			// execute the twig.initialize events
			nodes.forEach((node) => {

				const service = event.container.get(node.getServiceId());
				if (service) {
					const method = node.getParameter('method');
					if (method && typeof service[method] === 'function') {
						calls.push((cb) => {
							service[node.getParameter('method')](event.container, TwigJS, (err) => {
								cb(err);
							});
						});
					}
				}
			});

			if (calls.length !== 0) {
				async.series(calls, (err) => {
					if (err) {
						event.container.get('logger').debug(err.stack || err);
					}
					next();
				});
			} else {
				next();
			}

		});

	}

	/**
	 * Configure TwigJS and register it within express
	 *
	 * @param {Container} container
	 * @param {Function} next
	 * @returns {void}
	 */
	onConfigureViewEngine(container, next) {

		const config = container.get('config').get('twig');

		// override twig's renderFile to deal with namespaced template names
		// for 'extends' and 'include'
		// hopefully this never breaks in future versions!!!
		TwigJS.extend(function(TwigJS) {

			const regSuffix = /\.html\.twig$/i;

			const loadRemote = TwigJS.Templates.loadRemote;
			TwigJS.Templates.loadRemote = function(location, params, callback, error_callback) {

				const parts = location.split(':');
				if (parts.length !== 2) {

					// not a namespace path - pass it through
					return loadRemote.apply(this, arguments);

				}

				// private relativePath function in Twig.core.js cannot be overloaded
				// this function alters the location before it is passed into the loadRemote (in various places)
				// we need to format the location back into a valid namespace path
				// foo/bar/my-bundle:path/to/file ==> my-bundle:path/to/file

				const suffix = parts[0].split('/').pop();	// my-bundle
				const prefix = parts[1];					// path/to/file

				// my-bundle:path/to/file
				let namespace = suffix + ':' + prefix;

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

		container.get('logger').debug('[conga-twig] - setting twig.js as view engine');

		/**
		 * This is the render function that will be set on container
		 * for conga-view to call
		 *
		 * @param  {String}   template the namespaced template path
		 * @param  {Object}   data     the hash of data to render in template
		 * @param  {Function} cb       the callback
		 * @return {void}
		 */
		const renderer = (template, data, cb) => {

			TwigJS.renderFile(template, data, (err, html) => {

				cb(null, html);

			});

		};

		const engine = new TwigViewEngine(TwigJS);
		container.set('conga.view.engine.twig', engine);

		// copy over options
		for (var i in config.options){
			//app.locals[i] = config.options[i];
		}

		// add error templates
		if (container.hasParameter('conga.templates')) {
			container.getParameter('conga.templates')['exception'] = {
				'error404': { namespace : 'conga-twig:exception/error404' },
				'error500': { namespace : 'conga-twig:exception/error500' }
			};
		}

		next();
	}

	/**
	 * Register custom twig extensions (tags, filters, functions)
	 * @param {Container|*} container
	 * @param {String} extensionType The type of extension to register: tag, filter, function
	 * @private
	 */
	_registerCustomExtensions(container, extensionType) {

		const nodes = container.getTagsByName('twig.' + extensionType);

		if (!nodes) {
			return;
		}

		// sort the nodes by priority
		container.get('conga.ioc.tag.sorter').sortByPriority(nodes);

		TwigJS.extend(function(TwigJS) {

			// register the twig tags
			nodes.forEach((node) => {
				const service = container.get(node.getServiceId());
				if (service) {
					const method = node.getParameter('method');
					if (method && typeof service[method] === 'function') {

						service[node.getParameter('method')](container, TwigJS);

					} else if (typeof service.register === 'function') {

						service.register(container, TwigJS);

					}
				}
			});
		});
	}

}
