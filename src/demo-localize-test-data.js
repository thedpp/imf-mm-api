/** @module demo-localize-test-data 
 * 
 * Create localized data so that the demos work regardless of where
 * the software is installed.
 * 
 * NEVER do this in production. It's a horrible security truck sized hole!
 * 
 * If you do anything beyond testing with this code then set 
 * config.enable.localization to false in the config files
*/
const config = require('config')
const log = require('pino')(config.get('log_options'))
const u = require('./lib/util')
const rJ = u.left_pad_for_logging
const path = require('path')
const _module = require('path').basename(__filename)
const fs = require('fs')

const demo_json_filepath = 'docs/www/r/js/test-records.json'
const put_post_json_filepath = 'docs/www/r/js/put-post-records.json'

module.exports.localize = async function () {
    if (!config.get('enable.synth_local_test_data')) {
        //if localization was turned off then return
        return
    }

    const crawler = require('./lib/lib-crawl-fs')

    //crawl the put post assets so that the web page can test properly
    await crawler.crawl(path.resolve('__test__/assets-imf/'))
        .then(async crawled_assets => {
            asset_list = crawled_assets
            let asset_json = JSON.stringify(asset_list, undefined, 2)
            try {
                fs.writeFileSync(demo_json_filepath, asset_json, 'utf-8')
            } catch (e) {
                log.error(`${rJ(_module + ': ')}Crawl succeded but cannot write results to ${demo_json_filepath} from ${_module}.localize)`)
            }
        })
        .catch(e => {
            log.error(`${rJ(_module + ': ')}Demo Crawl failed: ${e.message} from ${_module}.localize)`)
        })

    //crawl the put post assets so that the web page can test properly
    await crawler.crawl(path.resolve('__test__/assets-put-post/'))
        .then(async crawled_assets => {
            asset_list = crawled_assets
            let asset_json = JSON.stringify(asset_list, undefined, 2)
            try {
                fs.writeFileSync(put_post_json_filepath, asset_json, 'utf-8')
            } catch (e) {
                log.error(`${rJ(_module + ': ')}Crawl succeded but cannot write results to ${put_post_json_filepath} from ${_module}.localize)`)
            }
        })
        .catch(e => {
            log.error(`${rJ(_module + ': ')}PUT POST Crawl failed: ${e.message} from ${_module}.localize)`)
        })
}