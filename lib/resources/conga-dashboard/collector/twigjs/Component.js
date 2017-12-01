import Vue from 'vue';

import './component.css';

const DANGER_TIME = 7500;
const WARNING_TIME = 3500;

export default Vue.extend({

    template: `

        <div id="twigjs-collector" v-if="d !== null">
        
            <div class="columns">
                <box class="column">
                    <span slot="header">Total Templates Rendered</span>
                    <span slot="body">{{ !d.templates ? 0 : d.templates.length }} Templates</span>
                </box>
                <box class="column">
                    <span slot="header">Total Load Time</span>
                    <span slot="body">{{ d.totalLoadTime / 1000 }} ms</span>
                </box>
                <box class="column">
                    <span slot="header">Total Render Time</span>
                    <span slot="body">{{ d.totalRenderTime / 1000 }} ms</span>
                </box>
                <box class="column">
                    <span slot="header">Errors Found</span>
                    <span slot="body">{{ d.errorsFound }} Errors</span>
                </box>
            </div>
            
            <blockquote>
                <p>
                    Render time represents how long the template took to render, 
                    including nested template load and render times.
                </p>
                <p>
                    Load time represents how long it takes to load and parse a single template.
                </p>
            </blockquote>
            
            <div class="body" v-if="d.templates && d.templates.length !== 0">
                <h3>Templates Rendered</h3>
                
                <p>The templates listed below are in the same order as they were loaded.</p>
                
                <div class="card collapsable" v-for="template in d.templates">
                    <header class="card-header">
                        <p class="card-header-title">
                            <span class="tag is-info">{{ template.bundle }}</span>
                            <span class="icon has-text-danger" v-if="template.error" title="Template Error">
                                <i class="fa fa-exclamation-circle" aria-hidden="true"></i>
                            </span>
                            <span class="icon has-text-danger" v-if="template.danger" title="Danger: Very slow load and / or render time!">
                                <i class="fa fa-clock-o" aria-hidden="true"></i>
                            </span>
                            <span class="icon has-text-warning" v-else-if="template.warning" title="Warning: Slow load and / or render time.">
                                <i class="fa fa-clock-o" aria-hidden="true"></i>
                            </span>
                            <span class="content">{{ template.path }}</span>
                        </p>
                        <a class="card-header-icon">
                            <span class="icon">
                                <i class="fa fa-angle-down"></i>
                            </span>
                        </a>
                    </header>
                    
                    <div class="card-content">
                        <div class="content">
                            <div v-if="template.error" class="error-card">
                                <h5 class="has-text-danger">Error</h5>
                                <pre>{{ template.error }}</pre>                                                                    
                            </div>
                        
                            <div class="card collapsable" v-if="template.params">
                                <header class="card-header">
                                    <h5 class="card-header-title">
                                        <span class="icon">
                                            <i class="fa fa-cog" aria-hidden="true"></i>
                                        </span>
                                        <span class="content">Parameters</span>
                                    </h5>
                                    <a class="card-header-icon">
                                        <span class="icon">
                                            <i class="fa fa-angle-down"></i>
                                        </span>
                                    </a>                                    
                                </header>
                                <div class="card-content">
                                    <div class="content">
                                        <pre><code class="json">{{ template.params }}</code></pre>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="card collapsable" v-if="template.source">
                                <header class="card-header">
                                    <h5 class="card-header-title">
                                        <span class="icon">
                                            <i class="fa fa-file-code-o" aria-hidden="true"></i>
                                        </span>
                                        <span class="content">Source</span>
                                    </h5>
                                    <a class="card-header-icon">
                                        <span class="icon">
                                            <i class="fa fa-angle-down"></i>
                                        </span>
                                    </a>                                    
                                </header>
                                <div class="card-content">
                                    <div class="content">
                                        <pre><code class="json">{{ template.source }}</code></pre>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="card collapsable" v-if="template.context">
                                <header class="card-header">
                                    <h5 class="card-header-title">
                                        <span class="icon">
                                            <i class="fa fa-code" aria-hidden="true"></i>
                                        </span>
                                        <span class="content">Context</span>
                                    </h5>
                                    <a class="card-header-icon">
                                        <span class="icon">
                                            <i class="fa fa-angle-down"></i>
                                        </span>
                                    </a>                                    
                                </header>
                                <div class="card-content">
                                    <div class="content">
                                        <pre><code class="json">{{ template.context }}</code></pre>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
    
                    <footer class="card-footer">
                        <span class="card-footer-item">
                            <span class="icon has-text-danger" v-if="template.loadTime >= d.DANGER_TIME">
                                <i class="fa fa-clock-o" aria-hidden="true"></i>
                            </span>
                            <span class="icon has-text-warning" v-else-if="template.loadTime >= d.WARNING_TIME">
                                <i class="fa fa-clock-o" aria-hidden="true"></i>
                            </span>
                            <span class="icon has-text-success" v-else>
                                <i class="fa fa-check" aria-hidden="true"></i>
                            </span>
                            Load Time 
                            &nbsp;<strong>{{ template.loadTime / 1000 }} ms</strong>
                        </span>
                        <span class="card-footer-item">
                            <span class="icon has-text-danger" v-if="template.renderTime >= d.DANGER_TIME">
                                <i class="fa fa-clock-o" aria-hidden="true"></i>
                            </span>
                            <span class="icon has-text-warning" v-else-if="template.renderTime >= d.WARNING_TIME">
                                <i class="fa fa-clock-o" aria-hidden="true"></i>
                            </span>
                            <span class="icon has-text-success" v-else>
                                <i class="fa fa-check" aria-hidden="true"></i>
                            </span>
                            Render Time 
                            &nbsp;<strong>{{ template.renderTime / 1000 }} ms</strong>
                        </span>
                        <span class="card-footer-item">
                            <span class="icon has-text-danger" v-if="template.totalTime >= d.DANGER_TIME">
                                <i class="fa fa-clock-o" aria-hidden="true"></i>
                            </span>
                            <span class="icon has-text-warning" v-else-if="template.totalTime >= d.WARNING_TIME">
                                <i class="fa fa-clock-o" aria-hidden="true"></i>
                            </span>
                            <span class="icon has-text-success" v-else>
                                <i class="fa fa-check" aria-hidden="true"></i>
                            </span>
                            Total Time 
                            &nbsp;<strong>{{ template.totalTime / 1000 }} ms</strong>
                        </span>
                    </footer>
                </div>
            </div>

        </div>

    `,

    props: ['d', 'request'],

    watch: {
        d: function(d) {
            if (!d || !d.templates) {
                return;
            }

            d.WARNING_TIME = WARNING_TIME;
            d.DANGER_TIME = DANGER_TIME;
            d.totalRenderTime = 0;
            d.totalLoadTime = 0;
            d.errorsFound = 0;

            for (const template of d.templates) {
                if (d.totalRenderTime === 0) {
                    // the first template's render time includes all nested templates
                    d.totalRenderTime = template.totalTime;
                }

                // each load time is independent
                d.totalLoadTime += template.loadTime;
                if (template.error) {
                    d.errorsFound += 1;
                }

                const [ bundle, path ] = template.location.split(':');
                template.bundle = bundle.split('/').pop();
                template.path = path.replace(/\.html\.twig$/, '') + '.html.twig';   //TODO: can the file extension be configured?

                template.danger = template.loadTime >= DANGER_TIME || template.renderTime >= DANGER_TIME;
                template.warning = !template.danger && (
                    template.loadTime >= WARNING_TIME || template.renderTime >= WARNING_TIME
                );
            }
        },
        request: function(request) {
            if (request === null) {
                return;
            }
            //console.log('twig collector', request.collectedData['TwigJS']);
        }
    },

    created: function() {
        this.collapsableListener = evt => {

        };
    },

    updated: function() {
        window.hljs.initHighlighting.called = false;
        window.hljs.initHighlighting();

        document.querySelectorAll('#twigjs-collector .card.collapsable').forEach(node => {
            node.querySelector('.card-header').addEventListener('click', evt => {
                const target = node.querySelector('.card-content');
                if (!target) {
                    return;
                }
                if (target.className.indexOf('is-hidden') === -1) {
                    target.className += ' is-hidden';
                } else {
                    target.className = target.className.replace(/is-hidden/g, '');
                }
            }, false);
            node.querySelector('.card-content').className += ' is-hidden';
        });
    }
});