import Vue from 'vue';

export default Vue.extend({

    template: `


        <div>

            <hero>

                <span slot="hero-title">TwigJS</span>
                <span slot="hero-subtitle">@conga/framework-view-twig</span>

                <div class="container" slot="hero-foot">

                    <tab-container>
                        <tab route="twigjs" label="Templates"></tab>
                        <tab route="twigjs.tags" label="Tags"></tab>
                        <tab route="twigjs.functions" label="Functions"></tab>
                        <tab route="twigjs.filters" label="Filters"></tab>
                    </tab-container>

                </div>

            </hero>

            <main-section>

                <div class="content">
                    <router-view></router-view>
                </div>

            </main-section>

        </div>

    `,

    data: function() {
        return {
            $route: this.$route
        }
    },

    created: function() {

    }
});
