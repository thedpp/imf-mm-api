/** DEPRECATED - to be incorporated into crawl */
/* jshint node: true */
'use strict'
const config = require('config')
const log = require('pino')(config.get('log_options'))
const u = require('./lib/util')
const rJ = u.left_pad_for_logging
const _module = require('path').basename(__filename)

const Router = require('koa-router');
const router = Router({
  prefix: `/scan`,
}); //Prefix all routes with /scan

//get our database
const db = require('./db')
const dbtk = require('./lib/lib-db-toolkit')

const not_implemented = async (ctx, next) => {
  ctx.status = 501
  ctx.set('Content-Type', 'text/plain')
  ctx.body = `imf-mm-api functionality not Implemented yet. Come back later.`
  // don't fire the next event. We're done
  await next()
};

const s3scan = require('./lib/lib-aws-s3-scan')

const scan_s3_bucket = async function (ctx, next) {
  let assets = []
  let asset

  ctx.status = 200
  ctx.body = `Assets scanned:\n`
  for (var b = 0; b < config.get('s3_asset_buckets').length; b++) {
    var new_assets = await s3scan.get_assets(config.get('s3_asset_buckets')[b])
    assets = assets.concat(new_assets)
  }
  if (assets.length == 0) {
    ctx.body += 'No assets found'
  }
  for (var a=0; a<assets.length; a++){
    let status= 'non-imf  --'
    if(assets[a].identifiers.length > 0){
      var res = await db.post( assets[a] )
      status = (res =='ok') ?  'added(ok) -' :  'add(fail) -' 
    }
    ctx.body += `${status} ${assets[a].aws.Key}  (${assets[a].file_size})\n`
  }
  // don't fire the next event. We're done
  await next()
};

router.use('/', not_implemented)
router.get('/s3', scan_s3_bucket)

log.info(`${rJ('module: ')}scan s3 initialised`)

module.exports = router;