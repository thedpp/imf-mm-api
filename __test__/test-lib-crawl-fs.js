/* jshint node: true */
/* globals afterAll, beforeAll, describe, expect, test */
'use strict'

/** lib-crawl tester
 *
 */
const fs = require('fs')
const path = require('path')
const __test = path.basename(__filename)

const config = require('config')
const log = require('pino')(config.get('log_options'))
const u = require('../src/lib/util')

const crawler = require('../src/lib/lib-crawl-fs')
const crawl = crawler.crawl

var test_root = path.join(__dirname, 'assets-imf')
var empty_root = path.join(__dirname, 'assets-imf/empty')

const test_db_folder = path.join(__dirname, '__db-local__')
const test_db_path = path.join(test_db_folder, config.get('database').local_crawl_filename)

describe(`${__test}: fs crawl core`, () => {
    describe('test config', () => {
        test('process.env.NODE_ENV is "test"', () => {
            expect(process.env.NODE_ENV).toEqual('test')
        })

        test(`test_root folder exists   (${test_root})`, () => {
            expect(fs.statSync(test_root).isDirectory()).toEqual(true)
        })

        test(`test_root folder has files (${test_root})`, () => {
            let files = fs.readdirSync(test_root)
            expect(files.length).toBeGreaterThan(0)
        })

        test(`empty_root folder exists   (${empty_root})`, () => {
            expect(fs.statSync(empty_root).isDirectory()).toEqual(true)
        })

        test(`empty_root folder is empty (${empty_root})`, () => {
            let files = fs.readdirSync(empty_root)
            // a single .gitignore file to force git to commit and checkout the folder
            expect(files.length).toEqual(1)
        })

        test(`test_db_folder exists   (${test_db_folder})`, () => {
            expect(fs.statSync(test_db_folder).isDirectory()).toEqual(true)
        })

      test(`a crawl database is not already defined (${test_db_path})`, () => {
            expect(fs.existsSync(test_db_path)).toEqual(false)        
        })
    })
    describe(`crawl test folder`, () => {
        test('file counts', async () => {
            return await crawl(test_root)
                .then((assets) => {
                    expect(assets.length).toBeGreaterThan(14)
                    expect(crawler.report.added.length).toEqual(20)
                    expect(crawler.report.skipped.length).toEqual(1)
                })
        })
        test('db commit', async () => {
            if((process.env.NODE_ENV !=='test')||(config.get('database').local_crawl_filename.length < 1)){
              throw new Error('ERROR: Aborting jest: process.env.NODE_ENV !=="test". Data destruction might have occcured')
            }
            let db = require('../src/lib/lib-db-local')
            db.type = 'local'
            let params ={database_local_filename: test_db_path}
            
            //check we can init a local database with the test config
            await db.init(params)
                .then(data => {
                    expect(data).toEqual('ok')
            })
            let success = true
            for(const asset in crawl.assets){
              let posted = await db.post(asset)
              expect(posted).toEqual('ok')
              success = success && (posted == 'ok')
            }
            return success
        })
      
      
    })
})