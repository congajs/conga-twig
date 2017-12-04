module.exports = class TestFilter {
    register(container, Twig) {
        Twig.exports.extendFilter('test', (str, args) => {
            return 'TEST-FILTER ' + str + ' TEST-FILTER';
        });
    }
};