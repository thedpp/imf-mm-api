/** @module lib-validate-asset-api-record
 * 
 * validate a record that has been submitted via the API
 */

/* jshint node: true */
'use strict'
const config = require('config')
const log = require('pino')(config.get('log_options'))
const u = require('./lib/util')
const rJ = u.left_pad_for_logging
const _module = require('path').basename(__filename)

/**
 * 
 * @param {asset_registration_post_object} asset - asset sent via PUT or POST
 * @returns {Object} 
 * @property {number} status - the appropriate status code based on the values given
 * @property {string} status_label - a short text equivalent of the status
 * @property {string} message - an error message or success message for returning or discarding
 */
let json_values = (asset) => {
    let res = {
        status: 201,
        label: config.get('paths./assets.post.responses.201.content.application/json.example.status_label'),
    }
    return res
}