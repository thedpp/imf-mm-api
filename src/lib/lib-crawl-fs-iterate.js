/** @module lib-crawl-fs-iterate
 * 
 * Recursively read a folder and then optionally filter it
 *
 */
/* jshint node: true */
'use strict'
var fs = require('fs');
var path = require('path');

const config = require('config')
const log = require('pino')(config.get('log_options'))
const u = require('./util')
const rJ = u.left_pad_for_logging
const _module = require('path').basename(__filename)

log.debug(rJ(`${_module}: `) + `init`)

fs.readdirAsync = function(folder_path) {
    return new Promise(function(resolve, reject) {
        fs.readdir(folder_path, function(err, list) {
            if (err) {
                reject(err);
            } else {
                resolve(list);
            }
        });
    });
}


fs.statAsync = function(file) {
    return new Promise(function(resolve, reject) {
        fs.stat(file, function(err, stat) {
            if (err) {
                reject(err);
            } else {
                resolve(stat);
            }
        });
    });
}

/** iterate a folder and subfolders, optionally filtering the results
 * 
 * files beginning with . are ignored (e.g. .gitignore)
 * 
 * Example:
 * ```
 *   iterate(".", function(f) {
 *       // filter out 
 *       return !(/(^|\/)\.[^\/\.]/g).test(f);
 *   }).then(function(results) {
 *       console.log(results);
 *   });
 * ```
 */
function iterate(folder_path, filterFn) {
    // default filter function accepts all files
    filterFn = filterFn || function (filename) { return !( filename.startsWith('.') ) }

    return fs.readdirAsync(folder_path)
        .then(function (list) {
            return Promise.all(list.map(function (file) {
                file = path.resolve(folder_path, file);
                return fs.statAsync(file)
                    .then(function (stat) {
                        if (stat.isDirectory()) {
                            return iterate(file, filterFn);
                        } else {
                            return filterFn(file) ? file : "";
                        }
                    });
            }))
                .then(function (results) {
                    return results.filter(function (f) {
                        return !!f;
                    });
                });
        })
        .then(function (results) {
            // flatten the array of arrays
            return Array.prototype.concat.apply([], results);
        });
}

module.exports = iterate
