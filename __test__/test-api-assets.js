/* jshint node: true */
/* globals afterAll, beforeAll, describe, expect, test */
'use strict'

/** api-assets jest test scripts
 * 
 */
const config = require('config')
const log = require('pino')(config.get('log_options'))
const u = require('../src/lib/util')
const rJ = u.left_pad_for_logging
const path = require('path')
const __test = path.basename(__filename)

const prefix = config.get('api_prefix')
const api = `${config.get('api_prefix')}/assets`

// Test the server using the test port (you can replace this with any URL)
let request = require('supertest');
request = request(`http://localhost:${config.get('port')}`)
let app

beforeAll(async () => {
    log.info(`${rJ('Jest starting:')} server booting on http://localhost:${config.get('port')}.`);
    log.info(`${rJ('Jest db:')} ${config.get('port')}.`);
    /// prevent race conditions by waiting for the server to be listening on its port
    try {
        app = require('../src/start_local')
        await request.get('/')
    } catch (e) {
        log.error(`${rJ('Server failed to start:')} ${e}.`);
    }
});

// close koa's http after each test
afterAll(() => {
    app.server.mm_http_instance.close();
    log.info(`${rJ('Jest finishing:')} ${__test} server shutdown.`);
});

// Local test database may be empty here so check basic functions

describe(`${__test}: testing GET /${api}`, () => {
    test(`GET /${api}`, async () => {
        //assert code 200, json content type and the body contains required 
        return request
            .get(`/${api}`)
            .expect(200)
            .expect('Content-Type', /json/)
            .expect(/"limit":/)
            .expect(/"results":/)
            .expect(/"skip":/)
            .expect(/"total":/)
    });
    test(`GET /${api}/`, async () => {
        //assert code 200, json content type and the body contains required 
        return request
            .get(`/${api}/`)
            .expect(200)
            .expect('Content-Type', /json/)
            .expect(/"limit":/)
            .expect(/"results":/)
            .expect(/"skip":/)
            .expect(/"total":/)
    });
});

// Scan the test folder and build a local database (asssum that bit's working)