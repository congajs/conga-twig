export default [

    {
        path: "/twigjs",
        component: require('./TwigJSComponent').default,

        children: [
            {
                name: "twigjs",
                path: "",
                component: require('./TemplateComponent').default
            },
            {
                name: "twigjs.tags",
                path: "tags",
                component: require('./TagComponent').default
            },
            {
                name: "twigjs.functions",
                path: "functions",
                component: require('./FunctionComponent').default,
                props: true
            },
            {
                name: "twigjs.filters",
                path: "filters",
                component: require('./FilterComponent').default,
                props: true
            }
        ]
    }

];
