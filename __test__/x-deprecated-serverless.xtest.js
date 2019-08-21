/* jshint node: true */
/* globals afterAll, beforeAll, describe, expect, test */
'use strict'
require('dotenv').config({ path: '__test__/.env', })

/* jshint node: true */
/* globals afterAll, beforeAll, describe, expect, test */
'use strict'

//ensure all the paths to the local node resources are found properly in lambda
process.env.PATH = `${process.env.PATH}:${process.env.LAMBDA_TASK_ROOT}`;

/**
 * Note that AWS will abort if arrow functions are used to define the handler!!
 */

//config management load order described here: https://github.com/lorenwest/node-config/wiki/Configuration-Files
//config files depends on NODE_ENV: development, staging, beta, production

//load the config
var config = require('config');
var serverless = require('serverless-http')
var Koa = require('koa');
var Router = require('koa-router');

var server = new Koa();
var router = new Router();

const path = require('path')
const __test = path.basename(__filename)

function hello_world(ctx, next) {
    ctx.status = 200;
    ctx.body = `Hello World`;
}

router.get('/', hello_world)
//Require the Router for all the asset routes.js
server.getMaxListeners();

console.log(`Using npm serverles-http to for AWS API Gateway proxy integration with Koa`);

server.use(router.routes());
module.exports.handler = serverless(server);

/**
 * Note that AWS will abort if arrow functions are used to define the handler!!
 */

// console.log('remaining time =', context.getRemainingTimeInMillis());
// console.log('functionName =', context.functionName);
// console.log('AWSrequestID =', context.awsRequestId);

