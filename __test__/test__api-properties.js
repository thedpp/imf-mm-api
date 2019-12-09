/**
 * @module test__api
 */
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

describe(`${_module}`, () => {
    describe('post', () => {
        test('201 label', () => {
            expect(config.get('paths./assets.post.responses.201.content.application/json.example.status_label').length).toBeGreaterThan(3)
        })
        test('201 description', () => {
            expect(config.get('paths./assets.post.responses.201.description').length).toBeGreaterThan(3)
        })
        test('409 label', () => {
            expect(config.get('paths./assets.post.responses.409.content.application/json.example.status_label').length).toBeGreaterThan(3)
        })
        test('409 description', () => {
            expect(config.get('paths./assets.post.responses.409.description').length).toBeGreaterThan(3)
        })
        test('415 label', () => {
            expect(config.get('paths./assets.post.responses.415.content.application/json.example.status_label').length).toBeGreaterThan(3)
        })
        test('415 description', () => {
            expect(config.get('paths./assets.post.responses.415.description').length).toBeGreaterThan(3)
        })
    })
})