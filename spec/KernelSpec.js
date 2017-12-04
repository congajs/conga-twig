const fs = require('fs');
const path = require('path');
const request = require('request');
const Kernel = require('@conga/framework/lib/kernel/TestKernel');

describe("Kernel", () => {

    let kernel;

    beforeAll((done) => {

        kernel = new Kernel(
            path.join(__dirname, '..', 'spec', 'data', 'projects', 'sample'),
            'app',
            'test',
            {}
        );

        kernel.addBundlePaths({
            'demo-bundle': path.join(__dirname, '..', 'spec', 'data', 'projects', 'sample', 'src', 'demo-bundle'),
            '@conga/framework-view-twig': path.join(__dirname, '..'),
            '@conga/framework-view': path.join(__dirname, '..', 'node_modules', '@conga', 'framework-view')
        });

        kernel.boot(() => {
            done();
        });
    });

    it("should return a valid response with a rendered template", (done) => {

        request({
            uri: 'http://localhost:5555/',
            method: 'GET'

        }, (error, response, body) => {
            expect(response.statusCode).toEqual(200);
            expect(response.headers['content-type']).toEqual('text/html; charset=utf-8');
            expect(body).toEqual("<h1>Hello bar</h1>\n");
            done();
        });

    });

    it("should return a valid response for a template which extends a layout", (done) => {

        request({
            uri: 'http://localhost:5555/test-layout',
            method: 'GET'

        }, (error, response, body) => {

            expect(response.statusCode).toEqual(200);
            expect(response.headers['content-type']).toEqual('text/html; charset=utf-8');
            expect(body).toEqual("<h1>this is a layout</h1><p>Here is some content</p>");
            done();
        });

    });

    it("should return a valid response for a template which includes another", (done) => {

        request({
            uri: 'http://localhost:5555/test-include',
            method: 'GET'

        }, (error, response, body) => {

            expect(response.statusCode).toEqual(200);
            expect(response.headers['content-type']).toEqual('text/html; charset=utf-8');
            expect(body).toEqual("<h1>This is the include test</h1><p>Included template</p>\n");
            done();
        });

    });

    it("should return a valid response for a template which renders data", (done) => {

        request({
            uri: 'http://localhost:5555/test-data',
            method: 'GET'

        }, (error, response, body) => {

            expect(response.statusCode).toEqual(200);
            expect(response.headers['content-type']).toEqual('text/html; charset=utf-8');
            expect(body).toEqual("world | localhost | a custom parameter\n");
            done();
        });

    });

    it("should return a valid response for a template which renders a custom tag", (done) => {

        request({
            uri: 'http://localhost:5555/test-tags',
            method: 'GET'

        }, (error, response, body) => {

            expect(response.statusCode).toEqual(200);
            expect(response.headers['content-type']).toEqual('text/html; charset=utf-8');
            expect(body).toEqual("TEST-TAG testing world TEST-TAG");
            done();
        });

    });

    it("should return a valid response for a template which renders a custom filter", (done) => {

        request({
            uri: 'http://localhost:5555/test-filters',
            method: 'GET'

        }, (error, response, body) => {

            expect(response.statusCode).toEqual(200);
            expect(response.headers['content-type']).toEqual('text/html; charset=utf-8');
            expect(body).toEqual("testing TEST-FILTER world TEST-FILTER");
            done();
        });

    });

    it("should return a valid response for a template which uses url_for helper functions", (done) => {

        request({
            uri: 'http://localhost:5555/test-helpers',
            method: 'GET'

        }, (error, response, body) => {

            expect(response.statusCode).toEqual(200);
            expect(response.headers['content-type']).toEqual('text/html; charset=utf-8');
            expect(body).toEqual(
                `http://localhost:5555/test-layout\n/test-include\n/test-include?c=d&a=b\n/route-with-params/hello/world\n`
            );
            done();
        });

    });

});
