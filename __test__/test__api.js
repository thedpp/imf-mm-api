/* jshint node: true */
/* globals afterAll, beforeAll, describe, expect, test */
'use strict'
require('dotenv').config({ path: '__test__/.env', })

/**
 * api jest test scripts
 */
const config = require('config')
const log = require('pino')(config.get('log_options'))
const u = require('../src/lib/util')
const rJ = u.left_pad_for_logging
const path = require('path')
const __test = path.basename(__filename)

const prefix = config.get('api_prefix')
const assets_api = `${config.get('mount_point')}/${config.get('api_prefix')}/assets`
const admin_info_api = `${config.get('mount_point')}/admin/info`
const crawl_api = `${config.get('mount_point')}/crawl/`

// Test the server using the test port
let request = require('supertest');
let app = require('../src/start_local')
let testServer = request(`http://localhost:${config.get('port')}`)

// close koa's http after each test
afterAll(() => {
    app.server.mm_http_instance.close();
    log.info(`${rJ('Jest finishing: ')}${__test} server shutdown.`);
});

// Local test database may be empty here so check basic functions

describe(`${__test}: testing Assets`, () => {
    test(`GET ${assets_api}`, async () => {
        //assert code 200, json content type and the body contains required 
        return testServer
            .get(`${assets_api}`)
            .expect(200)
            .expect('Content-Type', /json/)
            .expect(/"limit":/)
            .expect(/"results":/)
            .expect(/"skip":/)
            .expect(/"total":/)
    });
    test(`GET ${assets_api}/`, async () => {
        //assert code 200, json content type and the body contains required 
        return testServer
            .get(`${assets_api}/`)
            .expect(200)
            .expect('Content-Type', /json/)
            .expect(/"limit":/)
            .expect(/"results":/)
            .expect(/"skip":/)
            .expect(/"total":/)
    });
});

describe(`${__test}: testing Admin`, () => {
    test(`GET ${admin_info_api}`, async () => {
        //assert code 200, json content type and the body contains required 
        return testServer
            .get(`/${admin_info_api}`)
            .expect(404)
    });
});

describe(`${__test}: testing Crawl`, () => {
    test(`GET ${crawl_api}`, async () => {
        //assert code 200, json content type and the body contains required 
        return testServer
            .get(`/${crawl_api}`)
            .expect(404)
    });
});
