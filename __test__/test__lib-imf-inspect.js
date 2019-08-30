/* jshint node: true */
/* globals afterAll, beforeAll, describe, expect, test */
'use strict'
require('dotenv').config({ path: '__test__/.env', })

/** lib-crawl-fs-inspect tester
 *
 */
const fs = require('fs')
const path = require('path')
const __test = path.basename(__filename)

const config = require('config')
const log = require('pino')(config.get('log_options'))
const u = require('../src/lib/util')
const rJ = u.left_pad_for_logging

const imf_inspect = require('../src/lib/lib-imf-inspect')
const file_type = require('../src/asset_types.json')
var test_root = path.join(__dirname, 'assets-imf')
var empty_root = path.join(__dirname, 'assets-imf', 'empty')

let tt = require('./test-data/test-asset-ids')

describe(`${__test}: validate lib-imf-inspect`, () => {
    describe('test config', () => {
        test('process.env.NODE_ENV is "test"', () => {
            expect(process.env.NODE_ENV).toEqual('test')
        })

        test(`test_root  exists   (${test_root})`, () => {
            expect(fs.statSync(test_root).isDirectory()).toEqual(true)
        })

        test(`test_root has files (${test_root})`, () => {
            let files = fs.readdirSync(test_root)
            expect(files.length).toBeGreaterThan(0)
        })

        test(`empty_root exists (${empty_root})`, () => {
            expect(fs.statSync(empty_root).isDirectory()).toEqual(true)
        })

        test(`empty_root is empty (${empty_root})`, () => {
            let files = fs.readdirSync(empty_root)
            // a single .gitignore file to force git to commit and checkout the folder
            expect(files.length).toEqual(1)
        })

        test(`ASSETMAP exists (${tt.map00_path})`, () => {
            expect(fs.statSync(tt.map00_path).isFile()).toEqual(true)
        })

        test(`CPL exists (${tt.cpl02_path})`, () => {
            expect(fs.statSync(tt.cpl02_path).isFile()).toEqual(true)
        })

        test(`PKL exists (${tt.pkl03_path})`, () => {
            expect(fs.statSync(tt.pkl03_path).isFile()).toEqual(true)
        })
    })

    describe(`logic`, () => {
        test('read ASSETMAP', () => {
            let inspect = new imf_inspect()
            return inspect.from(tt.map00_path)
                .then(() => {
                    expect(inspect.buf_length).toEqual(Math.min(fs.statSync(tt.map00_path).size, inspect.buffer_max_length))
                })
        })
        test('read CPL', () => {
            let inspect = new imf_inspect()
            return inspect.from(tt.cpl02_path)
                .then(() => {
                    expect(inspect.buf_length).toEqual(Math.min(fs.statSync(tt.cpl02_path).size, inspect.buffer_max_length))
                })
        })
        test('read PKL', () => {
            let inspect = new imf_inspect()
            return inspect.from(tt.pkl03_path)
                .then(() => {
                    expect(inspect.buf_length).toEqual(Math.min(fs.statSync(tt.pkl03_path).size, inspect.buffer_max_length))
                })
        })
        test('read video', () => {
            let inspect = new imf_inspect()
            return inspect.from(tt.v00_path)
                .then(() => {
                    expect(inspect.buf_length).toEqual(Math.min(fs.statSync(tt.v00_path).size, inspect.buffer_max_length))
                })
        })
        test('read audio', () => {
            let inspect = new imf_inspect()
            return inspect.from(tt.a01_path)
                .then(() => {
                    expect(inspect.buf_length).toEqual(Math.min(fs.statSync(tt.a01_path).size, inspect.buffer_max_length))
                })
        })
        test('ASSETMAP is_xml, is_map, !is_cpl, !is_pkl', async () => {
            let inspect = new imf_inspect()
            await inspect.from(tt.map00_path)
            expect(inspect.is_xml()).toEqual(true)
            expect(inspect.is_map()).toEqual(true)
            expect(inspect.is_cpl()).toEqual(false)
            expect(inspect.is_pkl()).toEqual(false)
            expect(inspect.imf_xml_id()).toEqual(tt.map00_id)
        })
        test('PKL is_xml, is_pkl, !is_map, !is_cpl', async () => {
            let inspect = new imf_inspect()
            await inspect.from(tt.pkl03_path)
            expect(inspect.is_xml()).toEqual(true)
            expect(inspect.is_map()).toEqual(false)
            expect(inspect.is_cpl()).toEqual(false)
            expect(inspect.is_pkl()).toEqual(true)
            expect(inspect.imf_xml_id()).toEqual(tt.pkl03_id)
        })
        let inspect = new imf_inspect()
        test('CPL is_xml, is_cpl, !is_map, !is_pkl', async () => {
            let inspect = new imf_inspect()
            await inspect.from(tt.cpl02_path)
            expect(inspect.is_xml()).toEqual(true)
            expect(inspect.is_map()).toEqual(false)
            expect(inspect.is_cpl()).toEqual(true)
            expect(inspect.is_pkl()).toEqual(false)
            expect(inspect.imf_xml_id()).toEqual(tt.cpl02_id)
        })
    })
    describe(`is_imf logic`, () => {
        test('ASSETMAP is_imf', async () => {
            let inspect = new imf_inspect()
            let imf = await inspect.imf_asset_record(tt.map00_path)
            expect(imf.file_size).toEqual(fs.statSync(tt.map00_path).size)
            expect(imf.file_type).toEqual(file_type.alias.map)
            expect(imf.identifiers[0]).toEqual(tt.map00_id)
        })
        test('CPL is_imf', async () => {
            let inspect = new imf_inspect()
            let imf = await inspect.imf_asset_record(tt.cpl02_path)
            expect(imf.file_size).toEqual(fs.statSync(tt.cpl02_path).size)
            expect(imf.file_type).toEqual(file_type.alias.cpl)
            expect(imf.identifiers[0]).toEqual(tt.cpl02_id)
        })
        test('PKL is_imf', async () => {
            let inspect = new imf_inspect()
            let imf = await inspect.imf_asset_record(tt.pkl03_path)
            expect(imf.file_size).toEqual(fs.statSync(tt.pkl03_path).size)
            expect(imf.file_type).toEqual(file_type.alias.pkl)
            expect(imf.identifiers[0]).toEqual(tt.pkl03_id)
        })
    })
})