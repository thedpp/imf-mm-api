/* jshint node: true */
/* globals afterAll, beforeAll, describe, expect, test */
'use strict'
require('dotenv').config({ path: '__test__/.env', })

/** SimpleDb storage tester
 *
 */
const config = require('config')
const log = require('pino')(config.get('log_options'))
const u = require('../src/lib/util')
const path = require('path')
const __test = path.basename(__filename)

const imf_simpledb = require('../src/lib/lib-db-aws-simpledb')

const test_assets = require('./test-data/test_assets.json')
const test_asset1= test_assets[0]
const test_asset2= test_assets[1]

var params = {
    domain_name: 'a-new-db-with-a-unique-name',
}
var error_params = {
    domain_name: 'a-non-existant-domain',
}

describe(`${__test} simple db`, () => {

    describe('Database basics', () => {

        test('rejects a promise if the dB does not exist', () => {
            return imf_simpledb.info(error_params)
                .catch(e =>
                    expect(e).toMatch(/No such Database(.*)/)
                )
        })

        test('init a dB', () => {
            return imf_simpledb.init(params)
                .then(data => {
                    expect(data).toEqual('ok')
                })
        })

        test('returns metadata if the dB exists', () => {
            return imf_simpledb.info(params)
                .then(data => {
                    expect(data.db_name).toEqual(params.domain_name)
                })
        })

        test('add test_asset1 to a new dB', () => {
            return imf_simpledb.post(test_asset1)
                .then(data => {
                    expect(data).toEqual('ok')
                })
        })

        test('add test_asset2 to a new dB', () => {
            return imf_simpledb.post(test_asset2)
                .then(data => {
                    expect(data).toEqual('ok')
                })
        })

        test('get all assets from dB', () => {
            return imf_simpledb.get(100)
                .then(data => {
                    expect(data.length).toEqual(2)
                })
        })
    })

})