/* jshint node: true */
/* globals afterAll, beforeAll, describe, expect, test */
'use strict'

/** db-local storage tester
 *
 */
const fs = require('fs')
const path = require('path')
const __test = path.basename(__filename)

const config = require('config')
const log = require('pino')(config.get('log_options'))
const u = require('../src/lib/util')

const local_db = require('../src/lib/lib-db-local')
const test_assets = require('./test-data/test_assets.json')
const test_asset1= test_assets[0]
const test_asset2= test_assets[1]

const test_folder = path.join(__dirname, '__db-local__')
var params = {
    local_filename: path.join(test_folder, config.get('database').local_filename),
}
var error_params = {
    local_filename: path.join(test_folder, '^j:\\illegal%:filename'),
}

describe(`${__test}: local db`, () => {
    describe('test config', () => {
        test('process.env.NODE_ENV is "test"', () => {
            expect(process.env.NODE_ENV).toEqual('test')
        })

        test(`test_folder exists (${test_folder})`, () => {
            expect(fs.statSync(test_folder).isDirectory()).toEqual(true)
        })

        test(`test_folder can be written (${test_folder})`, () => {
            //we get an exception if we can't write to the file
            let random_file = path.join(test_folder, `testy${Math.floor(Math.random()*1000)+1}.json`)
            fs.writeFileSync(random_file, '{"Just some test data":42}','utf8')
        })

        test('we can delete all files in test folder', () => {
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

        test('info(db) rejects a promise if the dB cannot be used', () => {
            return local_db.info(error_params)
                .catch(e =>
                    expect(e.message).toMatch(/ENOENT(.*)/)
                )
        })

        test('init a dB', () => {
            return local_db.init(params)
                .then(data => {
                    expect(data).toEqual('ok')
                })
        })

        test('returns metadata if the dB exists', () => {
            return local_db.info()
                .then(data => {
                    expect(data.db_name).toEqual(params.local_filename)
                })
        })

        test('add test_asset1 to a new dB', () => {
            return local_db.post(test_asset1)
                .then(data => {
                    expect(data).toEqual('ok')
                })
        })

        test('add test_asset2 to a new dB', () => {
            return local_db.post(test_asset2)
                .then(data => {
                    expect(data).toEqual('ok')
                })
        })

        test('get all assets from dB', () => {
            return local_db.get(100)
                .then(data => {
                    expect(data.length).toEqual(2)
                })
        })
    })
})