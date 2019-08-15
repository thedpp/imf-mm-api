/* jshint node: true */
/* globals afterAll, beforeAll, describe, expect, test */
'use strict'

/** api-crawl jest test scripts
 * 
 */
const config = require('config')
const log = require('pino')(config.get('log_options'))
const u = require('../src/lib/util')
const rJ = u.left_pad_for_logging

const path = require('path')
const __test = path.basename(__filename)

//The crawl API is not versioned and has no prefix
const api = `crawl`

// Test the server using the test port (you can replace this with any URL)
let request = require('supertest');
let app
//redefine request so that it uses the test port
request = request(`http://localhost:${config.get('port')}`)


// - - - - - -- - - - - -- - - - - -- - - - - -- - - - - -- - - - - -- - - - - -

//BEFORE: to test the crawler we always use local database
let test_db_type = "local"
let test_db_path = path.join(__dirname, "__db__", "db-local-test-crawl")

beforeAll(async () => {
    log.info(`${rJ('Jest starting:')} server booting on http://localhost:${config.get('port')}.`);
    log.info(`${rJ('Jest db:')} ${test_db_type} (${test_db_path}).`);
    /// prevent race conditions by waiting for the server to be listening on its port
    try {
        app = require('../src/start_local')
        await request.get('/')
    } catch (e) {
        //nothing
    }
});

// AFTER: close koa's http after each test
afterAll(async () => {
    app.server.mm_http_instance.close();
    log.info(`${rJ('Jest finishing:')} server shutdown.`);
});

// - - - - - -- - - - - -- - - - - -- - - - - -- - - - - -- - - - - -- - - - - -

describe(`${__test}: testing GET /${api}`, () => {
    test.only(`GET /${api}`, async () => {
        //assert code 200, json content type and the body contains required 
        return request
            .get(`/${api}`)
            .expect(200)
            .expect('Content-Type', /json/)
            .expect(/(\"id\")\:/)
            .expect(/("id"):/)
            .expect(/("active"):/)
    });
    test(`GET /${api}/`, async () => {
        //assert code 200, json content type and the body contains required 
        return request
            .get(`/${api}/`)
            .expect(200)
            .expect('Content-Type', /json/)
            .expect(/(\"id\")\:/)
            .expect(/("id"):/)
            .expect(/("active"):/)
    });
});

// Scan the test folder and build a local database (asssume that bit's working)