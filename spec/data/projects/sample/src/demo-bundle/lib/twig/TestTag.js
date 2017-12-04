module.exports = class TestTag {

	register(container, Twig) {
		Twig.exports.extendTag({
			type: 'test',
			regex: /^test$/mi,
			next: ['endtest'],
			open: true,
			compile: function(token) {
				return token;
			},
			parse: function(token, context, chain) {
                return {
                    chain: chain,
                    output: 'TEST-TAG ' + Twig.parse.apply(this, [token.output, context]) + ' TEST-TAG'
                };
			}
		});
        Twig.exports.extendTag({
            type: 'endtest',
            regex: /^\s*endtest\s*$/mi,
            next: [ ],
            open: false
        });
	}

};
