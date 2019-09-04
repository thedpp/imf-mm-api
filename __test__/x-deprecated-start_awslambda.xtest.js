/* jshint node: true */
/* globals afterAll, beforeAll, describe, expect, test */
'use strict'
require('dotenv').config({ path: '__test__/.env', })

/**
 * Note that AWS will abort if arrow functions are used to define the handler!!
 */

exports.handler = async function (event, context){
    console.log('remaining time =', context.getRemainingTimeInMillis())
    console.log('functionName =', context.functionName)
    console.log('AWSrequestID =', context.awsRequestId)

    var httpStatusCode = 200;

    console.log(event.path)
    console.log(event.resource)
    var sample_event = {
        "message": "Hello me!",
        "input": {
            "resource": "/{proxy+}",
            "path": "/hello/world",
            "httpMethod": "POST",
            "headers": {
                "Accept": "*/*",
                "Accept-Encoding": "gzip, deflate",
                "cache-control": "no-cache",
                "CloudFront-Forwarded-Proto": "https",
                "CloudFront-Is-Desktop-Viewer": "true",
                "CloudFront-Is-Mobile-Viewer": "false",
                "CloudFront-Is-SmartTV-Viewer": "false",
                "CloudFront-Is-Tablet-Viewer": "false",
                "CloudFront-Viewer-Country": "US",
                "Content-Type": "application/json",
                "headerName": "headerValue",
                "Host": "gy415nuibc.execute-api.us-east-1.amazonaws.com",
                "Postman-Token": "9f583ef0-ed83-4a38-aef3-eb9ce3f7a57f",
                "User-Agent": "PostmanRuntime/2.4.5",
                "Via": "1.1 d98420743a69852491bbdea73f7680bd.cloudfront.net (CloudFront)",
                "X-Amz-Cf-Id": "pn-PWIJc6thYnZm5P0NMgOUglL1DYtl0gdeJky8tqsg8iS_sgsKD1A==",
                "X-Forwarded-For": "54.240.196.186, 54.182.214.83",
                "X-Forwarded-Port": "443",
                "X-Forwarded-Proto": "https",
            },
            "multiValueHeaders": {
                'Accept': [
                    "*/*",
                ],
                'Accept-Encoding': [
                    "gzip, deflate",
                ],
                'cache-control': [
                    "no-cache",
                ],
                'CloudFront-Forwarded-Proto': [
                    "https",
                ],
                'CloudFront-Is-Desktop-Viewer': [
                    "true",
                ],
                'CloudFront-Is-Mobile-Viewer': [
                    "false",
                ],
                'CloudFront-Is-SmartTV-Viewer': [
                    "false",
                ],
                'CloudFront-Is-Tablet-Viewer': [
                    "false",
                ],
                'CloudFront-Viewer-Country': [
                    "US",
                ],
                '': [
                    "",
                ],
                'Content-Type': [
                    "application/json",
                ],
                'headerName': [
                    "headerValue",
                ],
                'Host': [
                    "gy415nuibc.execute-api.us-east-1.amazonaws.com",
                ],
                'Postman-Token': [
                    "9f583ef0-ed83-4a38-aef3-eb9ce3f7a57f",
                ],
                'User-Agent': [
                    "PostmanRuntime/2.4.5",
                ],
                'Via': [
                    "1.1 d98420743a69852491bbdea73f7680bd.cloudfront.net (CloudFront)",
                ],
                'X-Amz-Cf-Id': [
                    "pn-PWIJc6thYnZm5P0NMgOUglL1DYtl0gdeJky8tqsg8iS_sgsKD1A==",
                ],
                'X-Forwarded-For': [
                    "54.240.196.186, 54.182.214.83",
                ],
                'X-Forwarded-Port': [
                    "443",
                ],
                'X-Forwarded-Proto': [
                    "https",
                ],
            },
            "queryStringParameters": {
                "name": "me",
                "multivalueName": "me",
            },
            "multiValueQueryStringParameters": {
                "name": [
                    "me",
                ],
                "multivalueName": [
                    "you",
                    "me",
                ],
            },
            "pathParameters": {
                "proxy": "hello/world",
            },
            "stageVariables": {
                "stageVariableName": "stageVariableValue",
            },
            "requestContext": {
                "accountId": "12345678912",
                "resourceId": "roq9wj",
                "stage": "testStage",
                "requestId": "deef4878-7910-11e6-8f14-25afc3e9ae33",
                "identity": {
                    "cognitoIdentityPoolId": null,
                    "accountId": null,
                    "cognitoIdentityId": null,
                    "caller": null,
                    "apiKey": null,
                    "sourceIp": "192.168.196.186",
                    "cognitoAuthenticationType": null,
                    "cognitoAuthenticationProvider": null,
                    "userArn": null,
                    "userAgent": "PostmanRuntime/2.4.5",
                    "user": null,
                },
                "resourcePath": "/{proxy+}",
                "httpMethod": "POST",
                "apiId": "gy415nuibc",
            },
            "body": "{\r\n\t\"a\": 1\r\n}",
            "isBase64Encoded": false,
        },
    }
    var sample_output = {
        "isBase64Encoded": true | false,
        "statusCode": httpStatusCode,
        "headers": {
            "headerName": "headerValue",
        },
        "multiValueHeaders": {
            "headerName": ["headerValue", "headerValue2", ],
        },
        "body": "...",
    }

}