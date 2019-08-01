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
const rJ = u.left_pad_for_logging

const iterate = require('../src/lib/lib-crawl-fs-iterate')

var test_root = path.join(__dirname, 'assets-imf', 'tones')
var empty_root = path.join(__dirname, 'assets-imf', 'empty')

describe(`${__test}: fs iteration`, () => {
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
            //the empty folder contains a single gitignore so that git creates an empty folder
            expect(files.length).toEqual(1)
        })
    })

    describe(`crawl folder`, () => {
        test('empty folder returns nothing', () => {
            return iterate(empty_root)
                .then((files) => {
                    // a single .gitignore file to force git to commit and checkout the folder
                    expect(files.length).toEqual(1)
                })
        })

        test('test_folder returns some files', () => {
            return iterate(test_root)
                .then((files) => {
                    expect(files.length).toBeGreaterThan(14)
                })
        })
    })
})