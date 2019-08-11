/** @module lib-crawl-fs
 * 
 */
/* jshint node: true */
'use strict'
const config = require('config')
const log = require('pino')(config.get('log_options'))
const u = require('./util')
const rJ = u.left_pad_for_logging
const path = require('path')
const _module = path.basename(__filename)
log.debug(`${rJ(_module)} init`)

const iterate = require('./lib-crawl-fs-iterate')
const imf_inspect = require('./lib-imf-inspect')
let file_type = require('../asset_types.json')

/* Set up some variables to allow monitoring progress for large crawls
 */
let length = 0
let files = []
let current = 0
let active = false
let assets = []
let report = { added: [], skipped: [], }

/** crawl a folder for IMF assets
 * 
 */
module.exports.crawl = async (folder) => {
    //reset the variables so we can track progress
    active = true
    let files = []
    let current = 0
    let hash_table = []

    return new Promise(async (resolve, reject) => {
        try {
            // get a list of all the files
            files = await iterate(folder)
            length = files.length
            //log.debug(`${rJ('fs crawl:')} ${files.length} files in ${folder}`)

            //now inspect the files one by one with a new, clean inspect instance
            for (current = 0; current < length; current++) {
                let inspect = new imf_inspect()
                var asset = await inspect.imf_asset_record(files[current])
                if (asset) {
                    assets.push(asset)
                    report.added.push(files[current])
                } else {
                    report.skipped.push(files[current])
                }
                //append any hash table generated
                hash_table = hash_table.concat(inspect.get_hash_table())
            }

            //finally go through the list of assets to match any hashes that we found
            for (const a in assets) {
                let asset = assets[a]
                let asset_ids = asset.identifiers
                for (const h in hash_table) {
                    for (const i in asset_ids) {
                        if (asset_ids[i] == hash_table[h].id) {
                            asset.identifiers.push(hash_table[h].hash_hex_str)
                        }
                    }
                }
            }

            //tidy up for asynchronous calls
            active = false
            files = []
            resolve(assets)
        } catch (e) {
            active = false
            files = []
            reject(e)
        }
    })
}

/** populate the database from the crawl
 */
module.exports.populate_db = async (db) => {
    //check that we have something to add to the database

}
module.exports.length = length
module.exports.files = files
module.exports.current = current
module.exports.active = active
module.exports.report = report
module.exports.assets = assets
