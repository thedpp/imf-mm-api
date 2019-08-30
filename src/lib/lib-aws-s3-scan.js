/* jshint node: true */
'use strict'
const AWS = require("aws-sdk")
const config = require('config')
const log = require('pino')(config.get('log_options'))
const u = require('./util')
const rJ = u.left_pad_for_logging
const _module = require('path').basename(__filename)

const metadata = {
    awskey_for: {
        hash: "x-amz-meta-imf-hash-sha1-base64",
        type: "x-amz-meta-imf-id",
    },
}

var aws_auto_config = new AWS.Config();

var s3 = new AWS.S3();

//get the head metadata synchronously because we don't care about speed
const add_head_metadata = async (bucket, key, asset) => {
    return new Promise((resolve, reject) => {
        var params = {
            Bucket: bucket,
            Key: key,
        }
        s3.headObject(params, function (err, data) {
            if (err) {
                log.info(err, err.stack)
                reject(err)
            }
            asset.aws.Metadata = data.Metadata
            //log.info(`${asset.aws.Key} (${asset.file_size}), {hash:${data.Metadata["imf-hash-sha1-base64"]}, id:${data.Metadata["imf-id"]}}`)
            resolve()
        })
    })
}

module.exports.get_assets = async function (s3_location) {
    return new Promise((resolve, reject) => {
        //access keys are ontained automatically from 
        //process.env.
        AWS.config.update({
            region: s3_location.region,
        });

        var params = {
            Bucket: s3_location.bucket,
            Prefix: s3_location.root,
        }

        let assets = []
        const provider_id = config.get('provider_id')
        //return a list of objects - note that this will fail for large buchets.
        s3.listObjectsV2(params, async function (err, data) {
            if (err) {
                reject(err)
            }
            for (let c = 1; c < data.Contents.length; c++) {
                let obj = data.Contents[c]
                if (obj.Size > 0) {
                    let asset = {}
                    asset.user = {
                        id: "usr-10000001",
                        name: "mrmxf",
                    }
                    asset.aws = {
                        Key: obj.Key,
                        ETag: obj.ETag,
                        LastModified: obj.LastModified,
                        StorageClasss: obj.StorageClass,
                    }
                    asset.identifiers = []
                    asset.locations = {
                        locationProviderId: provider_id,
                        locationList: [],
                    }
                    asset.file_size = obj.Size
                    asset.file_type = ""
                    asset.$$ref = ""

                    await add_head_metadata(params.Bucket, obj.Key, asset)

                    //process this asset for addition to the database
                    if(asset.aws.Metadata["imf-hash-sha1-base64"]){
                        asset.identifiers.push(`urn:sha1:${asset.aws.Metadata["imf-hash-sha1-base64"]}`)
                    }
                    if(asset.aws.Metadata["imf-id"]){
                        asset.identifiers.push(asset.aws.Metadata["imf-id"])
                    }
                    if(asset.identifiers.length>0){
                        asset.locations.locationList.push(`http://imf-mm-api.cloud/${asset.aws.Key}`)
                    }
                    assets.push(asset)
                }
            }
            resolve(assets)
        })
    })

}