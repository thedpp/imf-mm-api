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

const Router = require('koa-router');
const fs = require('fs')

//Prefix all routes for this API with /crawl
const router = Router({ prefix: `/crawl`, })

//get our crawler library
const crawler = require('./lib/lib-crawl-fs')
let crawl_id = 'idle'

const get_crawl_status = async (ctx, next) => {
  ctx.status = 200
  ctx.set('Content-Type', 'application/json')

  let status = {
    id: "idle",
    active: crawler.active,
  }
  if (crawler.active) {
    status.root = path.resolve(config.get('imf_asset_folders')[0])
    let num_files = crawler.files.length
    let done = (crawler.report.added) ? crawler.report.added.length : 0
    done += (crawler.report.skipped) ? crawler.report.skipped.length : 0
    status.progress = (num_files > 0) ? 100 * done / num_files : 0
  }else{
    status.report = crawler.report
  }
  //prettify the JSON with an indent of 2
  ctx.body = JSON.stringify(status, undefined, 2)

  await next()
}

const start_crawl_in_folder = async (ctx, next) => {
  ctx.status = 201
  ctx.set('Content-Type', 'application/json')

  // only crawl a single folder for now
  crawler.crawl(path.resolve(config.get('imf_asset_folders')[0]))
  //create a unique ID for this crawl
  crawl_id = moment().format('crawl_YYYYMMDD-HHmmss.SSS')

  ctx.body = JSON.stringify(
    {
      id: crawl_id,
      active: crawler.active,
      root: path.resolve(config.get('imf_asset_folders')[0]),
      activity: "startting",
      progress: 0,
    }
  )

  await next()
};

router.get(`/`, get_crawl_status)
router.get(`/:id`, get_crawl_status)
router.get(`/start`, start_crawl_in_folder)
router.post(`/start`, start_crawl_in_folder)

log.info(`${rJ('module:')} crawl-fs initialised`)

module.exports = router;