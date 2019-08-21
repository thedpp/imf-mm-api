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

const _ = require('underscore')

const config = require('config')
const log = require('pino')(config.get('log_options'))
const u = require('../src/lib/util')
const rJ = u.left_pad_for_logging

const mxf_lazy_parse = require('../src/lib/lib-mxf-lazy-parse')
const mxf_keys = require('../src/mxf_keys.json')
const imf_inspect = require('../src/lib/lib-imf-inspect')

var test_root = path.join(__dirname, 'assets-imf')
var empty_root = path.join(__dirname, 'assets-imf', 'empty')

let tt = require('./test-data/test-asset-ids')

let v_tf_id = new mxf_lazy_parse().buffer_from_uuid(tt.v00_id)
let a_tf_id = new mxf_lazy_parse().buffer_from_uuid(tt.a01_id)

describe(`${__test}:`, () => {
    describe('config', () => {
        test('process.env.NODE_ENV is "test"', () => {
            expect(process.env.NODE_ENV).toEqual('test')
        })

        test(`test_root exists (${test_root})`, () => {
            expect(fs.statSync(test_root).isDirectory()).toEqual(true)
        })

        test(`test_root has files (${test_root})`, () => {
            let files = fs.readdirSync(test_root)
            expect(files.length).toBeGreaterThan(0)
        })

        test(`empty_root exists   (${empty_root})`, () => {
            expect(fs.statSync(empty_root).isDirectory()).toEqual(true)
        })

        test(`empty_root empty (${empty_root})`, () => {
            let files = fs.readdirSync(empty_root)
            // a single .gitignore file to force git to commit and checkout the folder
            expect(files.length).toEqual(1)
        })

        test(`Video file exists   (${tt.v00_path})`, () => {
            expect(fs.statSync(tt.v00_path).isFile()).toEqual(true)
        })

        test(`Audio file exists (${tt.a01_path})`, () => {
            expect(fs.statSync(tt.a01_path).isFile()).toEqual(true)
        })
    })


    describe('mxf parsing', () => {
        test('constructor', () => {
            let parse = new mxf_lazy_parse()
            expect(_.isFunction(mxf_lazy_parse)).toEqual(true)
            expect(_.isFunction(parse.buffer_from_tag)).toEqual(true)
            expect(_.isFunction(parse.buffer_from_uuid)).toEqual(true)
            expect(_.isFunction(parse.get_source_package_umid)).toEqual(true)
        })
        test('buffer_from_tag', () => {
            let parse = new mxf_lazy_parse()
            function bad_tag1() {
                parse.buffer_from_tag('023g')
            }
            function bad_tag2() {
                parse.buffer_from_tag('12345')
            }
            expect(_.isFunction(parse.buffer_from_tag)).toEqual(true)
            expect(bad_tag1).toThrow(/ERROR: buffer_from_tag/)
            expect(bad_tag2).toThrow(/ERROR: buffer_from_tag/)
            let test_buf = Buffer.from([0xab, 0xef,])
            let test_res = parse.buffer_from_tag('abef')
            expect(Buffer.isBuffer(test_res)).toEqual(true)
            expect(Buffer.compare(test_res, test_buf)).toEqual(0)
            test_buf = Buffer.from([0x00, 0xff,])
            test_res = parse.buffer_from_tag('00ff')
            expect(Buffer.isBuffer(test_res)).toEqual(true)
            expect(Buffer.compare(test_res, test_buf)).toEqual(0)

        })
        test('buffer_from_uuid', () => {
            let parse = new mxf_lazy_parse()
            expect(_.isFunction(parse.buffer_from_uuid)).toEqual(true)
            expect(() => { parse.buffer_from_uuid('this is an error') }).toThrow(/ERROR: buffer_from_uuid/)
            expect(() => { parse.buffer_from_uuid('urn:uuid:123456781234567812345678123456789') }).toThrow(/ERROR: buffer_from_uuid/)
            let test_str = 'urn:uuid:12345678.12345678.12345678.12345678'
            let test_arr = [0x12, 0x34, 0x56, 0x78, 0x12, 0x34, 0x56, 0x78, 0x12, 0x34, 0x56, 0x78, 0x12, 0x34, 0x56, 0x78,]
            let test_buf = Buffer.from(test_arr)
            let test_res = parse.buffer_from_uuid(test_str)
            expect(Buffer.isBuffer(test_res)).toEqual(true)
            expect(Buffer.compare(test_res, test_buf)).toEqual(0)
        })
        test('is_mxf()', async () => {
            let inspect = new imf_inspect()
            let parse
            let buf

            await inspect.from(tt.v00_path)
            parse = new mxf_lazy_parse(inspect.buffer())
            expect(parse.is_mxf()).toEqual(true)

            await inspect.from(tt.a01_path)
            parse = new mxf_lazy_parse(inspect.buffer())
            expect(parse.is_mxf()).toEqual(true)

            await inspect.from(tt.map00_path)
            parse = new mxf_lazy_parse(inspect.buffer())
            expect(parse.is_mxf()).toEqual(false)

            await inspect.from(tt.cpl02_path)
            parse = new mxf_lazy_parse(inspect.buffer())
            expect(parse.is_mxf()).toEqual(false)

            await inspect.from(tt.pkl03_path)
            parse = new mxf_lazy_parse(inspect.buffer())
            expect(parse.is_mxf()).toEqual(false)
        })
        test('buffer_from_uuid(mxf_keys)', () => {
            let parse = new mxf_lazy_parse()
            expect(Buffer.isBuffer(parse.buffer_from_uuid(mxf_keys.PackageUID.key))).toEqual(true)
            expect(Buffer.isBuffer(parse.buffer_from_uuid(mxf_keys.MaterialPackage.key))).toEqual(true)
            expect(Buffer.isBuffer(parse.buffer_from_uuid(mxf_keys.SourcePackage.key))).toEqual(true)
        })
        test(`video TrackFile ID (UMID) ${tt.v00_path}`, async () => {
            let inspect = new imf_inspect()
            await inspect.from(tt.v00_path)
            let parse = new mxf_lazy_parse(inspect.buffer())

            let umid = parse.get_source_package_umid()
            expect(umid.length).toEqual(32)
            //check the prefix of the umid is right
            expect(umid.compare(Buffer.from([0x06, 0x0a, 0x2b, 0x34, 1, 1, 1, 5,]), 0, 8, 0, 8)).toEqual(0)
            //check the track file id is what we expect
            expect(umid.compare(v_tf_id, 0, 16, 16)).toEqual(0)
        })
        test(`audio TrackFile ID (UMID) ${tt.a01_path}`, async () => {
            let inspect = new imf_inspect()
            await inspect.from(tt.a01_path)
            let parse = new mxf_lazy_parse(inspect.buffer())

            let umid = parse.get_source_package_umid()
            expect(umid.length).toEqual(32)
            //check the prefix of the umid is right
            expect(umid.compare(Buffer.from([0x06, 0x0a, 0x2b, 0x34, 1, 1, 1, 5,]), 0, 8, 0, 8)).toEqual(0)
            //check the track file id is what we expect
            expect(umid.compare(a_tf_id, 0, 16, 16)).toEqual(0)
        })
        test(`video TrackFile ID (direct) ${tt.v00_path}`, async () => {
            let inspect = new imf_inspect()
            await inspect.from(tt.v00_path)
            let parse = new mxf_lazy_parse(inspect.buffer())

            let tf_id = parse.get_track_file_id()
            expect(tf_id.length).toEqual(16)
            expect(tf_id.compare(v_tf_id)).toEqual(0)
        })
        test(`audio TrackFile ID (direct) ${tt.a01_path}`, async () => {
            let inspect = new imf_inspect()
            await inspect.from(tt.a01_path)
            let parse = new mxf_lazy_parse(inspect.buffer())

            let tf_id = parse.get_track_file_id()
            expect(tf_id.length).toEqual(16)
            expect(tf_id.compare(a_tf_id)).toEqual(0)
        })
    })
})