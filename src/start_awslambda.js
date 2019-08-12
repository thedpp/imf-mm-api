/* jshint node: true */
'use strict'
//Note that lambda behaves strangely for filenames with "-" hyphens
//ensure this start file has underscores.


//ensure all the paths to the local node resources are found properly in lambda
process.env.PATH = `${process.env.PATH}:${process.env.LAMBDA_TASK_ROOT}`

//config management load order described here: https://github.com/lorenwest/node-config/wiki/Configuration-Files
//NODE_ENV legal values: development, staging, beta, production
//see README.md for how to set this
const config = require('config')

var serverless = require('serverless-http')

const AWS = require("aws-sdk")
var aws_auto_config = new AWS.Config();
console.log(`koa Using acces: ${aws_auto_config.credentials.accessKeyId}`)

//load the server library
const server = require('./imf-mm-api-server').init()

//export the server and integrate with AWS LAMBDA PROXY
module.exports.handler = serverless(server)