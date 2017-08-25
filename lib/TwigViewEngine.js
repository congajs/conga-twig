/*
 * This file is part of the conga-twig module.
 *
 * (c) Anthony Matarazzo <email@anthonymatarazzo.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * This is the view engine for twig.js
 */
module.exports = class TwigEngine {
    /**
     * Construct the engine with the configured/modified twig.js module
     *
     * @param  {TwigJS} twig
     */
    constructor(twig) {
        this.twig = twig;
    }

    /**
     * Render the given (namespaced) template path with the given data hash
     *
     * @param  {String}   template the namespaced template path
     * @param  {Object}   data     the hash of data to render in template
     * @param  {Function} cb       the callback
     * @return {void}
     */
    render(template, data, cb) {
        this.twig.renderFile(template, data, (err, html) => {
            cb(err, html);
        });
    }

    /**
     * Render the template / view
     *
     * @param {Object} request The conga request
     * @param {Error|*} error The error
     * @param {Function} cb The callback to execute with the template data when done
     * @returns {void}
     */
    findTemplateForError(request, error, cb) {
        cb(null, {
            engine: 'twig',
            namespace: '@conga/framework-view-twig:error'
        });
    }
};
