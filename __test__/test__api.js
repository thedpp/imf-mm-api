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
        return testServer
            .get(`${assets_api}/`)
            .expect(200)
            .expect('Content-Type', /json/)
            .expect(/"limit":/)
            .expect(/"results":/)
            .expect(/"skip":/)
            .expect(/"total":/)
    });

    test(`GET ${assets_api}?[file-type]=ft.cpl`, async () => {
        return testServer
            .get(`${assets_api}?[file-type]=ft.cpl`).then(data => {
                const assets = JSON.parse(data.text).results;
                const list = assets.filter(asset => {
                    asset.file_type != 'ft.cpl'
                })

                expect(assets.length).not.toBe(0)
                expect(list.length).toBe(0)
            })
    });

    test(`GET ${assets_api}?[content-kind]=test`, async () => {
        return testServer
            .get(`${assets_api}?[content-kind]=test`).then(data => {
                const assets = JSON.parse(data.text).results;
                const list = assets.filter(asset => {
                    asset.content_kind != 'test'
                })

                expect(assets.length).not.toBe(0)
                expect(list.length).toBe(0)
            })
    });

    test(`GET ${assets_api}/urn:uuid:0252e87b-9716-4ef7-93f3-0b60ffa2e0a4/linked_cpls`, async () => {
        return testServer
            .get(`${assets_api}/urn:uuid:0252e87b-9716-4ef7-93f3-0b60ffa2e0a4/linked_cpls`).then(data => {
                const assets = JSON.parse(data.text).results;
                const list = assets.filter(asset => {
                    asset.file_type != 'ft.cpl'
                })
                expect(assets.length).not.toBe(0)
                expect(list.length).toBe(0)
            })
    });

    test(`GET ${assets_api}/urn:uuid:34ca64f5-300b-453f-b4f3-d0035b015d9f/linked_cpls`, async () => {
        return testServer
            .get(`${assets_api}/urn:uuid:34ca64f5-300b-453f-b4f3-d0035b015d9f/linked_cpls`).then(data => {
                const assets = JSON.parse(data.text).results;
                const list = assets.filter(asset => {
                    asset.file_type != 'ft.cpl'
                })

                expect(assets.length).not.toBe(0)
                expect(list.length).toBe(0)
            })
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
