/*
 * This file is part of the conga-twig module.
 *
 * (c) Anthony Matarazzo <email@anthonymatarazzo.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

// third party modules
const TwigJS = require('twig');
const async = require('async');

// local modules
const TwigViewEngine = require('./TwigViewEngine');

/**
 * Register custom twig extensions (tags, filters, functions)
 * @param {Container|*} container
 * @param {String} extensionType The type of extension to register: tag, filter, function
 * @private
 */
const registerExtension = (container, extensionType) => {

    const nodes = container.getTagsByName('twig.' + extensionType);

    if (!nodes || nodes.length === 0) {
        return;
    }

    // sort the nodes by priority
    container.get('conga.ioc.tag.sorter').sortByPriority(nodes);

    TwigJS.extend(Twig => {

        // register the twig tags
        nodes.forEach((node) => {
            const service = container.get(node.getServiceId());
            if (service) {
                const method = node.getParameter('method');
                if (method && service[method] instanceof Function) {

                    service[method].call(service, container, Twig);

                } else if (service.register instanceof Function) {

                    service.register(container, Twig);
                }
            }
        });
    });
};

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
        registerExtension(event.container, 'tag');
        registerExtension(event.container, 'filter');
        registerExtension(event.container, 'function');

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

        const { container } = event;

        const nodes = container.getTagsByName('twig.initialize');

        if (!nodes || nodes.length === 0) {
            next();
            return;
        }

        container.get('conga.ioc.tag.sorter').sortByPriority(nodes);

        TwigJS.extend(Twig => {

            const calls = [];

            // execute the twig.initialize events
            nodes.forEach((node) => {

                const service = container.get(node.getServiceId());
                if (service) {
                    const method = node.getParameter('method');
                    if (method && service[method] instanceof Function) {
                        calls.push(cb => {
                            service[method].call(service, container, Twig, cb);
                        });
                    }
                }
            });

            if (calls.length !== 0) {
                async.series(calls, (err) => {
                    if (err) {
                        container.get('logger').error(err.stack || err);
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

        //const config = container.get('config').get('twig');

        // override twig's renderFile to deal with namespaced template names
        // for 'extends' and 'include'
        // hopefully this never breaks in future versions!!!
        TwigJS.extend(Twig => {

            const regSuffix = /\.html\.twig$/i;
            const regNamespace = /(@[^\/]+\/[^:]+|[^\/:]+):/;

            const collector = container.get('twig.collector');
            const isCollectorEnabled = collector.isEnabled();

            if (isCollectorEnabled) {
                const render = Twig.Template.prototype.render;
                Twig.Template.prototype.render = function (context, params, allow_async) {
                    if (this._conga) {
                        this._conga.context = context;
                        if (context.conga.request) {
                            this._conga.profilerId = context.conga.request._profiler_id;
                        }
                        collector.renderStart(this._conga);
                    }
                    const result = render.call(this, context, params, allow_async);
                    if (result instanceof Promise) {
                        return result.then(() => {
                        	collector.renderFinished(this._conga);
                        }).catch(err => {
                        	collector.renderFinished(this._conga);
                            this._conga.error = err;
                            return Promise.reject(err);
                        });
                    }
                    collector.renderFinished(this._conga);
                    return result;
                };
            }

            const loadRemote = Twig.Templates.loadRemote;
            Twig.Templates.loadRemote = function(location, params, callback, error_callback) {

                let result;

                let profilerData;
                if (isCollectorEnabled) {
                    const callbackFn = callback;
                    profilerData = collector.addTemplate(location, params);
                    callback = template => {
                    	collector.loadFinished(profilerData);
                        template._conga = profilerData;
                        if (callbackFn instanceof Function) {
                            callbackFn(template);
                        }
                    };
                    const callbackErrFn = error_callback;
                    error_callback = err => {
                    	collector.loadFinished(profilerData);
                        profilerData.error = err;
                        if (callbackErrFn instanceof Function) {
                            callbackErrFn(err);
                        }
                    }
                }

                // TODO: use twigjs namespaces instead (https://github.com/twigjs/twig.js/wiki#namespaces)

                if (location.indexOf(':') === -1) {
                    // not a namespace path - pass it through
                    result = loadRemote.call(this, location, params, callback, error_callback);
                    if (collector.isEnabled() && result instanceof Twig.Template) {
                        result._conga = profilerData;
                    }
                    return result;
                }

                /* NOTE: private relativePath function in Twig.core.js cannot be overloaded
                   this function alters the location before it is passed into the loadRemote,
                   which happens in various places, and may put garbage in front of our
                   namespace path (the original location).

                   we need to format the location back into a valid namespace path
                   foo/bar/my-bundle:path/to/file ==> my-bundle:path/to/file */

                let namespace = location.split(regNamespace).slice(1).join(':');

                // append the extension to the namespace path
                if (!regSuffix.test(namespace)) {
                    namespace += '.html.twig';
                }

                // resolve the path
                location = container.get('namespace.resolver')
                    .resolveWithSubpath(namespace, 'lib/resources/views');

                // call original method
                result = loadRemote.call(this, location, params, callback, error_callback);
                if (isCollectorEnabled && result instanceof Twig.Template) {
                    result._conga = profilerData;
                }
                return result;
            };
        });

        container.get('logger').debug('[conga-twig] - setting twig.js as view engine');

        const engine = new TwigViewEngine(TwigJS);
        container.set('conga.view.engine.twig', engine);

        // copy over options
        // for (var i in config.options){
        // 	app.locals[i] = config.options[i];
        // }

        next();
    }
};
