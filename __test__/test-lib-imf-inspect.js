/* jshint node: true */
/* globals afterAll, beforeAll, describe, expect, test */
'use strict'

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

var asset0 = path.join(test_root, 'tones', 'imf-mm-api-test00')
var asset1 = path.join(test_root, 'tones', 'imf-mm-api-test01')
var asset2 = path.join(test_root, 'tones', 'imf-mm-api-test02')
var asset3 = path.join(test_root, 'noise', 'imf-mm-api-test03')

var v_path = path.join(asset0, 'test00-imf-mm-api_v0.mxf')
var a_path = path.join(asset1, 'test01-imf-mm-api_a0.mxf')
var map_path = path.join(asset0, 'ASSETMAP.xml')
var cpl_path = path.join(asset1, 'CPL_210ff802-c83f-4235-a5cd-c334447f98e6.xml')
var pkl_path = path.join(asset2, 'PKL_bee099d5-f6e6-4e78-a408-c608a15960a9.xml')

describe(`${__test}: validate lib-imf-inspect`, () => {
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

        test(`ASSETMAP file exists   (${map_path})`, () => {
            expect(fs.statSync(map_path).isFile()).toEqual(true)
        })

        test(`CPL file exists (${cpl_path})`, () => {
            expect(fs.statSync(cpl_path).isFile()).toEqual(true)
        })

        test(`PKL file exists (${pkl_path})`, () => {
            expect(fs.statSync(pkl_path).isFile()).toEqual(true)
        })
    })

    describe(`asset logic`, () => {
        test('read ASSETMAP', () => {
            let inspect = new imf_inspect()
            return inspect.from(map_path)
                .then(() => {
                    expect(inspect.buf_length).toEqual(Math.min(fs.statSync(map_path).size, inspect.buffer_max_length))
                })
        })
        test('read CPL', () => {
            let inspect = new imf_inspect()
            return inspect.from(cpl_path)
                .then(() => {
                    expect(inspect.buf_length).toEqual(Math.min(fs.statSync(cpl_path).size, inspect.buffer_max_length))
                })
        })
        test('read PKL', () => {
            let inspect = new imf_inspect()
            return inspect.from(pkl_path)
                .then(() => {
                    expect(inspect.buf_length).toEqual(Math.min(fs.statSync(pkl_path).size, inspect.buffer_max_length))
                })
        })
        test('read video', () => {
            let inspect = new imf_inspect()
            return inspect.from(v_path)
                .then(() => {
                    expect(inspect.buf_length).toEqual(Math.min(fs.statSync(v_path).size, inspect.buffer_max_length))
                })
        })
        test('read audio', () => {
            let inspect = new imf_inspect()
            return inspect.from(a_path)
                .then(() => {
                    expect(inspect.buf_length).toEqual(Math.min(fs.statSync(a_path).size, inspect.buffer_max_length))
                })
        })
        test('ASSETMAP is_xml, is_map, !is_cpl, !is_pkl', async () => {
            let inspect = new imf_inspect()
            await inspect.from(map_path)
            expect(inspect.is_xml()).toEqual(true)
            expect(inspect.is_map()).toEqual(true)
            expect(inspect.is_cpl()).toEqual(false)
            expect(inspect.is_pkl()).toEqual(false)
            expect(inspect.imf_xml_id()).toEqual('urn:uuid:87c7dc7c-8087-4f24-b29f-1ba925e93ff9')
        })
        test('PKL is_xml, is_pkl, !is_map, !is_cpl', async () => {
            let inspect = new imf_inspect()
            await inspect.from(pkl_path)
            expect(inspect.is_xml()).toEqual(true)
            expect(inspect.is_map()).toEqual(false)
            expect(inspect.is_cpl()).toEqual(false)
            expect(inspect.is_pkl()).toEqual(true)
            expect(inspect.imf_xml_id()).toEqual('urn:uuid:bee099d5-f6e6-4e78-a408-c608a15960a9')
        })
        let inspect = new imf_inspect()
        test('CPL is_xml, is_cpl, !is_map, !is_pkl', async () => {
            let inspect = new imf_inspect()
            await inspect.from(cpl_path)
            expect(inspect.is_xml()).toEqual(true)
            expect(inspect.is_map()).toEqual(false)
            expect(inspect.is_cpl()).toEqual(true)
            expect(inspect.is_pkl()).toEqual(false)
            expect(inspect.imf_xml_id()).toEqual('urn:uuid:210ff802-c83f-4235-a5cd-c334447f98e6')
        })
    })
    describe(`is_imf logic`, () => {
        test('ASSETMAP is_imf', async () => {
            let inspect = new imf_inspect()
            let imf = await inspect.imf_asset_record(map_path)
            expect(imf.file_size).toEqual(fs.statSync(map_path).size)
            expect(imf.file_type).toEqual(file_type.alias.mapl)
        })
        test('CPL is_imf', async () => {
            let inspect = new imf_inspect()
            let imf = await inspect.imf_asset_record(cpl_path)
            expect(imf.file_size).toEqual(fs.statSync(cpl_path).size)
            expect(imf.file_type).toEqual(file_type.alias.cpl)
        })
        test('PKL is_imf', async () => {
            let inspect = new imf_inspect()
            let imf = await inspect.imf_asset_record(pkl_path)
            expect(imf.file_size).toEqual(fs.statSync(pkl_path).size)
            expect(imf.file_type).toEqual(file_type.alias.pkl)
        })
    })
})