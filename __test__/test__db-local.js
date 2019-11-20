/* jshint node: true */
/* globals afterAll, beforeAll, describe, expect, test */
'use strict'
require('dotenv').config({ path: '__test__/.env',})
/**
 * db-local storage tester
 */
const fs = require('fs')
const path = require('path')
const _module = path.basename(__filename)

const config = require('config')
const log = require('pino')(config.get('log_options'))
const u = require('../src/lib/util')

const local_db = require('../src/lib/lib-db-local')
const test_assets = require('./test-data/test_assets.json')
const test_asset1= test_assets[0]
const test_asset2= test_assets[1]

const test_folder = path.join(__dirname, '__db-local__')
if (!fs.existsSync(test_folder)) {
    fs.mkdirSync(test_folder)
}

var params = {
    local_filename: path.join(test_folder, config.get('database').local_filename),
}
var error_params = {
    local_filename: path.join(test_folder, '^j:\\illegal%:filename.json'),
}

describe(`${_module}`, () => {
    describe('config', () => {
        test('process.env.NODE_ENV is "test"', () => {
            expect(process.env.NODE_ENV).toEqual('test')
        })

        test(`test_folder exists (${test_folder})`, () => {
            expect(fs.statSync(test_folder).isDirectory()).toEqual(true)
        })

        test(`can write test_folder (${test_folder})`, () => {
            //we get an exception if we can't write to the file
            let random_file = path.join(test_folder, `testy${Math.floor(Math.random()*1000)+1}.json`)
            fs.writeFileSync(random_file, '{"Just some test data":42}','utf8')
        })

        test('can delete files in test folder', () => {
            let files = fs.readdirSync(test_folder)
            //console.log('Files in test folder ....')
            //console.dir(files)
            files.forEach( (filepath) =>{
                fs.unlinkSync( path.join(test_folder, filepath) )
            })
            files = fs.readdirSync(test_folder)
            expect(files.length).toEqual(0)
        })
    })

    describe('dB core', () => {

        test('info(bad_db) rejects a promise', () => {
            return local_db.info(error_params)
                .catch(e =>
                    expect(e.message).toMatch(/ENOENT(.*)/)
                )
        })

        test('init()', () => {
            return local_db.init(params)
                .then(data => {
                    expect(data).toEqual('ok')
                })
        })

        test('db.info()', () => {
            return local_db.info()
                .then(data => {
                    expect(data.db_name).toEqual(params.local_filename)
                })
        })

        test('db.post(asset1)', () => {
            return local_db.post(test_asset1)
                .then(data => {
                    expect(data).toEqual('ok')
                })
        })

        test('db.post(asset2)', () => {
            return local_db.post(test_asset2)
                .then(data => {
                    expect(data).toEqual('ok')
                })
        })

        test('db.get()', () => {
            return local_db.get_assets()
                .then(data => {
                    expect(data.length).toEqual(2)
                })
        })
        test('db.get(0,1)', () => {
            return local_db.get_assets(0, 1)
                .then(data => {
                    expect(data.length).toEqual(1)
                })
        })
        test('db.get(1,1)', () => {
            return local_db.get_assets(1, 1)
                .then(data => {
                    expect(data.length).toEqual(1)
                })
        })
        test('db.get(2,100)', () => {
            return local_db.get_assets(2, 100)
                .then(data => {
                    expect(data.length).toEqual(0)
                })
        })
    })
})