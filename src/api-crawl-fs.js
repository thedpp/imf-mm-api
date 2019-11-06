/* jshint node: true */
'use strict'
/** @module api-crawl-fs
 * 
 * Crawl a file system for IMF assets
 * 
 * Algorithm:
 * 1. recursively scan folders from a root returning a list of all files
 * 2. scan the list and add IMF files to a new imf-list
 *    2a - add missing IDs to imf-list
 *    2b - update metadata for existing imf-list entries (e.g. second url)
 *    2c - log conflicts and warnings
 *    2d - Action rules:
 *       ASSETMAP - store the identifiers & metadata in a new list (sha1 is an alias of the id)
 *       PKL - check the id and validate url, treat like ASSETMAP
 *       CPL - check the id and validate url
 * 3. With imf-list
 *     3a - GET metadata for the ID from the database & PUT updates
 * 4. Optionally compute hashes
 *     4a - With imf-list
 *     4b - If no sha-1 then compute hash
 *     4c - If no sha-1 then GET record & PUT updates
 */

const config = require('config')
const moment = require('moment')
const path = require('path')
const log = require('pino')(config.get('log_options'))
const u = require('./lib/util')
const rJ = u.left_pad_for_logging
const _module = require('path').basename(__filename)

const Router = require('koa-router');
const fs = require('fs')

//Prefix all routes for this API with /crawl
const router = Router({ prefix: `/crawl`, })

//get our crawler library
const crawler = require('./lib/lib-crawl-fs')
const crawl_ratio = 0.5
let crawl_id = 'idle'
let crawl_start
let crawl_end
let asset_list = []
let posted_count = 0

/** return the status of the crawl
 * Depending on database and file system, we can be in a number of states:
 *  - idle - nothing going on
 *  - initialising - getting ready to crawl
 *  - crawling #N - searching through file system #N
 *  - posting #N - posting the results of file system #N to the database
 *  - finishing - tidying up
 * @returns {number} from 0-100 indicating completion where 0-60 is scanning and 60-100 is updating dB
 */
const get_crawl_status = async (ctx, next) => {
  ctx.status = 200
  ctx.set('Content-Type', 'application/json')

  //determine the current state:
  let state = 'idle'
  if (crawler.active) {
    state = 'crawling'
  } else {
    if (posted_count < asset_list.length) {
      state = 'posting'
    }
  }

  let body = {
    id: crawl_id,
    start: crawl_start,
    end: crawl_end,
    state: state,
    imf_asset_path: [],
  }
  for (let p = 0; p < 1; p++) {
    let cstat = {
      root: path.resolve(config.get('imf_asset_sources')[p]),
    }

    if (state == 'crawling') {
      let num_files = crawler.files.length
      let done = (crawler.report.added) ? crawler.report.added.length : 0
      done += (crawler.report.skipped) ? crawler.report.skipped.length : 0
      cstat.progress = (num_files > 0) ? crawl_ratio * done / num_files : 0
      cstat.progress = `${Math.round(100 * cstat.progress)}%`
    }

    if (state == 'posting') {
      let num_files = (crawler.report.added) ? crawler.report.added.length : 0
      let done = (crawler.report.added) ? crawler.report.added.length : 0
      cstat.progress = (num_files > 0) ? crawl_ratio + (1-crawl_ratio) *posted_count / num_files : 0
      cstat.progress = `${Math.round(100 * cstat.progress)}%`
    }
    cstat.report = (crawler.report) ? crawler.report : 'No crawl performed'

    body.imf_asset_path.push(cstat)
  }

  //prettify the JSON with an indent of 2
  ctx.body = JSON.stringify(body, undefined, 2)

  await next()
}

const start_crawl_in_folder = async (ctx, next) => {
  ctx.status = 201
  ctx.set('Content-Type', 'application/json')

  // only crawl a single folder for now
  crawler.crawl(path.resolve(config.get('imf_asset_sources')[0]))
    .then(async crawled_assets => {
      asset_list = crawled_assets

      let db = require('./db')

      for (posted_count = 0; posted_count < asset_list.length; posted_count++) {
        let posted = await db.post(asset_list[posted_count])
          .catch(e => {
            log.error(`${rJ(_module + ': ')}Crawl db update: ${e.message} from ${e.fileName}(${e.lineNumber})`)
          })
      }
    })
    .catch(e => {
      log.error(`${rJ(_module + ': ')}Crawl failed: ${e.message} from ${e.fileName}(${e.lineNumber})`)
    })
  //create a unique ID for this crawl
  crawl_id = "crawl-" + moment().format('YYYYMMDD-HHmmss.SS')

  ctx.body = JSON.stringify(
    {
      id: crawl_id,
      state: 'crawling',
      root: path.resolve(config.get('imf_asset_sources')[0]),
      progress: 0,
    }
  )

  await next()
};

router.get(`/`, get_crawl_status)
router.get(`/:id`, get_crawl_status)
router.post(`/start`, start_crawl_in_folder)
router.delete(`/`, get_crawl_status)

log.info(`${rJ('module: ')}crawl-fs initialised`)

module.exports = router;