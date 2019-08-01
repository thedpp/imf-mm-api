/* jshint node: true */
'use strict'
const log_aws_context = async (ctx, next) => {
    console.dir(ctx)

    // console.log('remaining time =', context.getRemainingTimeInMillis())
    // console.log('functionName =', context.functionName)
    // console.log('AWSrequestID =', context.awsRequestId)

    await next()
}
module.exports = log_aws_context;