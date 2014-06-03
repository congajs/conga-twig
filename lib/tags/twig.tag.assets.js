module.exports = function(container, Twig) {

	Twig.exports.extendTag({
		// unique name for tag type
		type: 'assets',

		// regex match for tag
		regex: /^assets\s+(.*)\s*$/mi,

		// this is an open tag and only coses with 'endassets'
		next: ['endassets'],
		open: true,

		// runs on matched tokens when the template is loaded. (once per template)
		compile: function (token) {

			var expression = token.match[1];

			// extract arguments for the compiler
			var tagInput = token.match.input.replace(/^\s*assets\s*/mi, '').replace(/^\s*|\s*$/g, '');
			try {
				token.files = JSON.parse('[' + tagInput + ']');
			} catch (e) {
				if (tagInput.indexOf('"') === -1) {
					try {
						// try to replace single quotes with double
						token.files = JSON.parse('[' + tagInput.replace(/'/g, '"') + ']');
					} catch (e) {
						token.files = [];
					}
				} else {
					token.files = [];
				}
			}

			// turn the string expression into tokens.
			token.stack = Twig.expression.compile.apply(this, [{
				type:  Twig.expression.type.expression,
				value: expression
			}]).stack;

			// cleanup
			delete token.match;

			return token;
		},

		// Runs when the template is rendered
		parse: function (token, context, chain) {

			var i ,
				len ,
				files = [] ,
				output = '' ,
				viewData = Object.create(context) ,
				env = container.getParameter('kernel.environment') ,
				junk = Twig.expression.parse.apply(this, [token.stack, context]) ,
				data = context.assets(token.files[0], token.files[1], token.files[2], false);

			if (env === 'development') {

				// dev environments print all of the files one-by-one
				data.files.forEach(function(file) {
					files.push(file + '?' + data.versionParameter + '=' + data.version);
				});

			} else {

				// prod or test print the combined file only
				files = [data.combinedFile];

			}

			// render the output one file at a time, respectively injecting URL into each
			for (i = 0, len = files.length; i < len; i++) {
				viewData.url = files[i];
				output += Twig.parse.apply(this, [token.output, viewData]);
			}

			return {
				chain: chain,
				output: output
			};
		}
	});

	// the matching end tag type 'endassets'
	Twig.exports.extendTag({
		type: 'endassets',
		regex: /^\s*endassets\s*$/mi,
		next: [ ],
		open: false
	});
};