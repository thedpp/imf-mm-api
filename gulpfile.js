/* jshint node: true */
'use strict'
const gulp = require('gulp')
const jsdoc = require('gulp-jsdoc3')
const zip = require('gulp-zip')
const path = require('path')
const fs = require('fs')
const chalk = require('chalk')
const jshint = require('gulp-jshint')
const stylish = require('jshint-stylish')

// handle the zip filename consistently with functions
const zip_filename = () => {
  return `${process.env.NODE_ENV}.zip`
}
const zip_path = () => {
  return 'deploy/aws-lambda/'
}
const zip_filepath = () => {
  return path.join(zip_path(), zip_filename())
}

gulp.task('watch', () => {
  gulp.watch('./code/*.js', ['gendoc', ])
});

gulp.task('lint', function() {
  return gulp.src(['./src/**/*.js', './__test__/**/*.js',])
    .pipe(jshint())
    .pipe(jshint.reporter(stylish));
});

/* copied & adapted from the jsdoc master config
 * https://github.com/mlucool/gulp-jsdoc3/blob/master/src/jsdocConfig.json
 */
var jsdoc_config = {
  "tags": {
    "allowUnknownTags": true,
  },
  "opts": {
    "destination": "./code-docs/",
  },
  "plugins": [
    "plugins/markdown",
  ],
  "templates": {
    "cleverLinks": false,
    "monospaceLinks": true, //modified
    "default": {
      "outputSourceFiles": false, //modified
    },
    "path": "ink-docstrap",
    "theme": "cerulean",
    "navType": "vertical",
    "linenums": true,
    "dateFormat": "MMMM Do YYYY, h:mm:ss a",
  },
}

gulp.task('gendoc', (cb) =>
  gulp.src(['README.md', './code/*.js', './extensions/*.js', ], {
    read: false,
  })
  .pipe(jsdoc(jsdoc_config, cb))
)

//pull deployment credentials from the shared credentials file ~/.aws/credentials
//runtime credentials are in the config

gulp.task("zip", function (cb) {
  //config management load order described here: https://github.com/lorenwest/node-config/wiki/Configuration-Files
  var config = require('config')

  if (undefined == process.env.NODE_ENV){
    console.log(chalk`{red ${'ERROR:'}} {blueBright process.env.NODE_ENV} is not defined`)
    done()
    return
  }

  try {
    fs.unlinkSync(zip_filepath())
    console.log(`old $${zip_filepath()}  deleted`);
  } catch (e) {
    console.log(`old $${zip_filepath()} cannot be deleted`);
  }

  console.log(`zip paths:`)
  console.dir(deploy_files)
  console.log(`zipping to ${zip_filepath()} ...`)

  //var params = config.lambda.params
  //var options = config.lambda.options
  return gulp.src(deploy_files, {
      base: '.',
    })
    .pipe(zip(zip_filename(), {
      FileComment: "Auto generated from gulp script",
    }))
    .pipe(gulp.dest(zip_path()))
})

gulp.task('mmupload', async () =>{

})