/* jshint node: true */
'use strict'
/** @module lib-mxf-lazy-parse
 * 
 * Parse an MXF Header for specific elemtnts on demand. Don't
 * scan everything and build the data set.
 */
const config = require('config')
const log = require('pino')(config.get('log_options'))
const u = require('./util')
const rJ = u.left_pad_for_logging
const _module = require('path').basename(__filename)

log.debug(`${rJ('mxf parse: ')}init`)

const fs = require('fs')
const path = require('path')
const util = require('util')
const binary = require('binary')

const mxf_keys = require('../mxf_keys.json')

//permitted prefixes for search elements
const prefix = [
  'urn:uuid:',
  'urn:smpte:ul:',
]

/**
 *  construct a new buffer parser object
 * */
module.exports = class MXF_Lazy_Parse {

  constructor(buf) {
    this.buf = buf
  }

  /** return a buffer containing a 
   * @param {String} tag - a 4 digit hex byte string e.g. '0410'
   * @returns {Buffer}
  */

  buffer_from_tag(tag) {

    let lower_tag = tag.trim().toLowerCase()

    if (lower_tag.match(/[^0-9a-f]/) || (lower_tag.length !== 4)) {
      throw new Error('ERROR: buffer_from_tag must be given exactly 2 bytes as a hex string')
    }

    //populate the array with 2 values
    let bytes = [
      parseInt(lower_tag.substr(0, 2), 16),
      parseInt(lower_tag.substr(2, 2), 16),
    ]
    return new Buffer.from(bytes)
  }

  /** check if the buffer is MXF
   * from 377-1 confirm that the first 11 bytes of a header
   * partition pack occurs in the first 65536 bytes
   */
  is_mxf() {

    let mxf_identifier = Buffer.from([0x06, 0x0E, 0x2B, 0x34, 0x02, 0x05, 0x01, 0x01, 0x0D, 0x01, 0x02,])

    // search the file buffer for the source package key and then the UMID tag
    let slices = binary.parse(this.buf)
      .scan('mxf_run_in', mxf_identifier)
      .vars

    //log.debug(`Slices length = ${slices.mxf_run_in.length}`)

    //we either have the UMID in the slices object or nothing
    if (slices.hasOwnProperty('mxf_run_in') && (slices.mxf_run_in.length < 65536)) {
      return true
    } else {
      return false
    }
  }

  /** return a buffer containing a key
   * @param {String} uuid - a urn encoded string represnting a uuid or ul
   * @returns {Buffer}
  */

  buffer_from_uuid(uuid) {

    let lower_str = uuid.trim().toLowerCase()
    let uuid_digits = false

    for (var i = 0; i < prefix.length; i++) {
      if (lower_str.startsWith(prefix[i])) {
        //remove prefix, dots and dodgy spaces
        uuid_digits = lower_str.substr(prefix[i].length)
        uuid_digits = uuid_digits.replace(/[-.\s]/g, '')
      }
    }

    if (uuid_digits) {
      if (32 !== uuid_digits.length) {
        throw new Error('ERROR: buffer_from_uuid must be given exactly 16 bytes in a UUID or UL')
      }
      //populate the array with 16 values
      let bytes = [
        parseInt(uuid_digits.substr(0, 2), 16),
        parseInt(uuid_digits.substr(2, 2), 16),
        parseInt(uuid_digits.substr(4, 2), 16),
        parseInt(uuid_digits.substr(6, 2), 16),
        parseInt(uuid_digits.substr(8, 2), 16),
        parseInt(uuid_digits.substr(10, 2), 16),
        parseInt(uuid_digits.substr(12, 2), 16),
        parseInt(uuid_digits.substr(14, 2), 16),
        parseInt(uuid_digits.substr(16, 2), 16),
        parseInt(uuid_digits.substr(18, 2), 16),
        parseInt(uuid_digits.substr(20, 2), 16),
        parseInt(uuid_digits.substr(22, 2), 16),
        parseInt(uuid_digits.substr(24, 2), 16),
        parseInt(uuid_digits.substr(26, 2), 16),
        parseInt(uuid_digits.substr(28, 2), 16),
        parseInt(uuid_digits.substr(30, 2), 16),
      ]
      return new Buffer.from(bytes)
    } else {
      throw new Error("ERROR: buffer_from_uuid must be given a string starting with one of " + prefix.join(', '))
    }
  }

  /* return the first Top Level File Packateg UMID */
  get_source_package_umid() {
    let source_package = this.buffer_from_uuid(mxf_keys.SourcePackage.key)
    let umid = this.buffer_from_tag(mxf_keys.PackageUID.tag)

    // search the file buffer for the source package key and then the UMID tag
    let slices = binary.parse(this.buf)
      .scan('mxf_header_junk', source_package)
      .buffer('length_of_KLV', 4)
      .scan('source_package_junk', umid)
      .buffer('tag_length', 2)
      .buffer('umid', 32)
      .vars

    //we either have the UMID in the slices object or nothing
    if (slices.hasOwnProperty('umid')) {
      return slices.umid
    } else {
      return false
    }
  }

  /** return the Track File Id in a Buffer
   * 
   */
  get_track_file_id() {
    let umid_buf = this.get_source_package_umid()
    //allocate a new buffer and fill with 0 for security
    let track_file_id_buf = Buffer.alloc(16, 0)
    //copy the 16 random bytes of the UMID
    umid_buf.copy(track_file_id_buf, 0, 16)
    return track_file_id_buf
  }

  /** return the Track File Id as a String
   * 
   */
  get_track_file_id_string() {
    let id = this.get_track_file_id().toString('hex')
    return 'urn:uuid:' + id.substr(0, 8) + '-' + id.substr(8, 4) + '-' + id.substr(12, 4) + '-' + id.substr(16, 4) + '-' + id.substr(20)
  }

}