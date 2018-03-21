// framework libs
let CongaProfiler;
try {
    // safely and quietly attempt to load the profiler module
    CongaProfiler = require('@conga/framework-profiler');
} catch(e) { }

let templates = [];

/**
 * The TwigDataCollector collects information on the templates that get rendered on each request
 */
const TwigDataCollector = CongaProfiler && class TwigDataCollector
    extends CongaProfiler.Collector.DataCollectorInterface
{
    /**
     *
     * @param {Container} container The service container
     */
    constructor(container) {
        super();
        this.container = container;
    }

    /**
     * Get the twig bundle configuration
     * @return {Object}
     */
    get config() {
        return this.container.get('config').get('twig');
    }

    /**
     * See if a type of data should be captured
     * @param {String} type Ex. "source", "parameters", "context"
     * @returns {boolean}
     */
    isCapture(type) {
        if (!this.isEnabled()) {
            return false;
        }
        const capture = this.config.profiler.capture;
        if (!capture) {
            return false;
        }
        if (capture === true) {
            return true;
        }
        if (!(capture instanceof Object)) {
            return true;
        }
        return !(type in capture) || capture[type];
    }

    /**
     * Add template data to the collector
     * @param {String} location The template location
     * @param {Object} params The template context
     * @returns {Object} The new data template object that was added
     */
    addTemplate(location, params) {
        if (!this.isEnabled()) {
            return null;
        }
        const data = {
            location,
            params,
            context: null,
            profilerId: null,
            error: null,
            renderStartedAt: 0,
            renderFinishedAt: 0,
            renderTime: 0,
            // NOTE: load time includes twig parser but not render
            loadStartedAt: CongaProfiler.Stopwatch.StopwatchPeriod.microtime(),
            loadFinishedAt: 0,
            loadTime: 0,
            totalTime: 0
        };
        templates.push(data);
        return data;
    }

    /**
     * {@inheritDoc}
     * @see DataCollectorInterface.getName
     */
    getName() {
        return 'TwigJS'
    }

    /**
     * {@inheritDoc}
     * @see DataCollectorInterface.hasDashboard
     */
    hasDashboard() {
        return true;
    }

    /**
     * {@inheritDoc}
     * @see DataCollectorInterface.isEnabled
     */
    isEnabled() {
        const config = this.config;
        if (!config || !config.profiler) {
            return false;
        }
        if (config.profiler === true) {
            return true;
        }
        return config.profiler instanceof Object && config.profiler.enabled;
    }

    /**
     * Register a finished load time for a template
     * @param {Object} template
     * @returns {TwigDataCollector}
     */
    loadFinished(template) {
        template.loadFinishedAt = CongaProfiler.Stopwatch.StopwatchPeriod.microtime();
        template.loadTime = template.loadFinishedAt - template.loadStartedAt;
        return this;
    }

    /**
     * Register a start render time for a template
     * @param {Object} template
     * @returns {TwigDataCollector}
     */
    renderStart(template) {
        template.renderStartedAt = CongaProfiler.Stopwatch.StopwatchPeriod.microtime();
        return this;
    }

    /**
     * Register a finished render time for a template
     * @param {Object} template
     * @returns {TwigDataCollector}
     */
    renderFinished(template) {
        template.renderFinishedAt = CongaProfiler.Stopwatch.StopwatchPeriod.microtime();
        template.renderTime = template.renderFinishedAt - template.renderStartedAt;
        template.totalTime = template.loadTime + template.renderTime;
        return this;
    }

    /**
     * {@inheritDoc}
     * @see DataCollectorInterface.collectData
     */
    collectData(request, response, document = null) {
        if (!this.isEnabled()) {
            return Promise.resolve(null);
        }
        let reduced = [];
        let collected = [];
        for (const node of templates) {
            if (node.profilerId && node.profilerId === request._profiler_id) {

                node.source = this.isCapture('source') && node.params.data;
                delete node.params.data;

                node.params = this.isCapture('parameters') && JSON.stringify(node.params, null, 2);

                if (this.isCapture('context')) {
                    let { conga, ...context } = node.context;
                    let { request, _conga } = conga;
                    context.conga = _conga;
                    try {
                        node.context = JSON.stringify(Object.keys(context).reduce((obj, key) => {
                            if (context[key] instanceof Function) {
                                obj[key] = '<Function>';
                            } else {
                                obj[key] = context[key];
                            }
                            return obj;
                        }, {}), null, 2);
                    } catch (e) {
                        node.context = {error: e.message, stack: e.stack};
                    }
                } else {
                    node.context = false;
                }

                collected.push(node);
            } else {
                reduced.push(node);
            }
        }
        templates = reduced;
        return Promise.resolve({ templates: collected });
    }
};

module.exports = TwigDataCollector || class { isEnabled() { return false; } };