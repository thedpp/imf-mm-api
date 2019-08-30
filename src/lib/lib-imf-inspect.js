/* jshint node: true */
'use strict'
/** @module lib-imf-inspect
 * 
 * Check an asset for imf-ness
 * rev2 - refactored to be a factory class.
 * 
 * The inspector allocate 66k of memory for parsing files to identify
 * XML and MXF when there are no file extensions or the data comes from an object
 * 
 *   - is_xxx() functions are synchronous
 *   - from() is asynchronous and needs await / Promise handling
 *   - get_xx() functions are asynchronous and needs await / Promise handling
 * 
 * Create as many inspectors as you need
 * 
 * Usage:
 * ```
 *  imf_inspect = require('./lib-imf-inspect)
 *  inspect =  new imf_inspect()
 *  // if you specify a string then it will be treated as a file source
 *  await inspect.from(file_path)
 *  let is_xml = inspect.is_xml()
 *  // if you specify nothing then the buffer is re-used
 *  let file_record = await get_imf_record()
 *  if (file_record === false){
 *     console.log('Not an IMF asset. Front Panel will now explode.')
 *  }
 * ```
 */

const config = require('config')
const log = require('pino')(config.get('log_options'))
const u = require('./util')
const rJ = u.left_pad_for_logging
const path = require('path')
const _module = require('path').basename(__filename)

log.debug(`${rJ(_module) + ': '}init`)

const mxf_parser = require('./lib-mxf-lazy-parse')

const fs = require('fs');
const util = require('util')
const xml2js = require('xml2js');
let parser = new xml2js.Parser();

let file_type = require('../asset_types.json')
const blank_asset_json = JSON.stringify(require('../asset_empty.json'))

//must be bigger than 65548 for MXF logic to work
const buffer_size = 100000

module.exports = class IMF_inspect {
    constructor(file_path) {
        this.buf = Buffer.alloc(buffer_size)
        this.buffer_length = 0
        this.buffer_max_length = buffer_size
        this.xml = ""
        this.xmljs = {}
        this.ns_prefix = ""
        this.file_path = file_path
        this.buffer_initialised = false
        //clone the empty object we create from the JSON file
        this.asset_record = JSON.parse(blank_asset_json)
        this.hash_table = []
    }

    /** return the buffer or false
     * 
     * If the buffer is not initiliased return undefined
     */
    buffer() {
        return (this.buffer_initialised) ? this.buf : undefined
    }

    /** Load the the buffer
     * @param {mixed} source - the source of the buffer
     * 
     * - {String} will load the buffer from a file_path specified by `source`
     * 
     */
    async from(source) {
        switch (typeof (source)) {
            case 'string':
                //log.debug(`${rJ('lib-imf-inspect: ')}loading buffer from ${source}`)
                return this._from_file(source)
            default:
                throw new Error(`lib-imf-inspec - cannot initialise buffer from parameter of type: ${typeof (source)}`)
        }
    }

    /** Load the first part of a file into a buffer
     * @return {Promise} chainable reference to the inspect instance
     */
    async _from_file(file_path) {
        const fread = util.promisify(fs.read)

        let fd = fs.openSync(file_path, 'r')
        return new Promise((resolve, reject) => {
            let obj = fread(fd, this.buf, 0, buffer_size, 0)
                .catch(e => {
                    log.error(`${rJ('fs crawl-inspect: ')}cannot load file (${file_path}) into working buffer`)
                    this.buffer_initialised = false
                    reject(e)
                }).then(async (bytes_read, the_buffer) => {
                    //never figured out why this function returns a number sometimes, an object at others
                    if (typeof (bytes_read) == 'number') {
                        log.debug(`${rJ(__filename + ': ')}returned a number not an object`)
                        this.buf_length = bytes_read
                    } else {
                        this.buf_length = bytes_read.bytesRead
                    }
                    //now we do the asynchronous xml parsing....
                    await this._parse_xml()
                    this.buffer_initialised = true
                    resolve(this)
                })
        })
    }

    /** is the buffer an  xml document?
     * @return {Promise} chainable reference to the inspect instance
     */
    async _parse_xml() {
        this.xml = this.buf.toString()
        let xml_prolog = /^\s*<\?\s*xml\s+.*\?>/

        let handle_parse_result = (err, result) => {
            if (err) {
                //bad XML resolves as not XML
                log.debug(`${rJ('lib-imf-inspect: ')}_parse_xml() could not parse buffer`)
                this.xmljs = {}
                this.resolve(this)
            } else {
                //good XML resolves as XML, but is not namespace aware
                this.xmljs = result
                let root_key = Object.keys(this.xmljs)[0]
                //detect a namespace prefix and remember it because the xml
                //to JSON library creates objects with names like 
                // cpl:CompostitionPlaylist
                let match = root_key.match(/(^[A-Za-z].*:)(.*)/)
                if (match) {
                    this.ns_prefix = match[1]
                } else {
                    this.ns_prefix = ""
                }
                this.resolve(this)
            }
        }


        return new Promise((resolve, reject) => {
            this.resolve = resolve
            if (this.xml.match(xml_prolog)) {
                // the callback will resolve the promise
                parser.parseString(this.xml, handle_parse_result.bind(this))
            } else {
                // no xml prolog so cannot be xml
                this.xmljs = {}
                resolve(this)
            }
        })
    }

    /** is the buffer an  xml document?
     * 
     * check to see that there are keys
     */
    is_xml() {
        return (Object.keys(this.xmljs).length > 0)
    }

    /** return the namespaced ID from the file
     * this might fail if the XML has a prefix on the root node but
     * uses the default namespace on the Id field
     * xml2JSON also returns all values as arrays
     */
    imf_xml_id() {
        let id
        let root_key = Object.keys(this.xmljs)[0]
        log.info(`Root key is ${root_key}`)
        try {
            id = this.xmljs[root_key][`${this.ns_prefix}Id`][0]
        } catch (e) {
            log.error('Bizarre - an IMF XML file without an Id')
        }
        return id
    }

    /** is the buffer an IMF ASSETMAP
     */
    is_map() {
        //check the root object of the XML (namespace prefix aware check)
        return (undefined !== this.xmljs[`${this.ns_prefix}AssetMap`])
    }

    /** is the buffer an IMF CPL
     */
    is_cpl() {
        //check the root object of the XML (namespace prefix aware check)
        return (undefined !== this.xmljs[`${this.ns_prefix}CompositionPlaylist`])
    }

    /** is the buffer an IMF PKL
     */
    is_pkl() {
        //check the root object of the XML (namespace prefix aware check)
        let has_pkl_root = (undefined !== this.xmljs[`${this.ns_prefix}PackingList`])

        if (has_pkl_root) {
            this.update_hash_table()
        }

        return has_pkl_root
    }

    /** udpate the hash table while we have the PKL loaded
     * 
     */
    update_hash_table() {
        let pkl_root = this.xmljs[`${this.ns_prefix}PackingList`]
        let assetlist_array = pkl_root[`${this.ns_prefix}AssetList`][0][`${this.ns_prefix}Asset`]

        //iterate through all the assets in the assetlist array
        for (const a in assetlist_array) {

            const asset = assetlist_array[a]
            let hash = {}
            hash.id = asset[`${this.ns_prefix}Id`][0]
            //the algorithm is an attribute of the value of the HashAlgorithm element
            hash.hash_algorithm = asset[`${this.ns_prefix}HashAlgorithm`][0].$.Algorithm
            //use node's Buffer module to parse the base64 string and create a series of bytes
            const hash_buffer = Buffer.from(asset[`${this.ns_prefix}Hash`][0], 'base64')
            //now use the buffer's hex function to make a hex string with leading zeroes
            hash.hash_hex_str = 'urn:sha1:' + hash_buffer.toString('hex')
            this.hash_table.push(hash)
        }

    }

    /** common asset properties
 * 
 */
    update_common_asset_properties(file_path) {
        this.asset_record.locations.push(path.resolve(file_path))
        this.asset_record.providers.push(config.get('provider_id'))
    }
    /** create an IMF asset or return false
     */
    async imf_asset_record(file_path) {
        await this.from(file_path)
        let stat = fs.statSync(file_path)

        return new Promise(async (resolve, reject) => {
            // empty files resolve as not IMF
            if (this.buf_length < 1) {
                resolve(false)
            }
            if (this.is_xml()) {
                this.asset_record.file_type = file_type.alias.xml
                if (this.is_cpl()) {
                    this.asset_record.file_type = file_type.alias.cpl
                }
                if (this.is_pkl()) {
                    this.asset_record.file_type = file_type.alias.pkl
                }
                if (this.is_map()) {
                    this.asset_record.file_type = file_type.alias.map
                }

                // @todo - figure out how to return XML assets referenced by a SCM
                // currently they will have no identifiers and will crash the parser
                if(this.asset_record.file_type == file_type.alias.xml){
                    resolve(false)
                }

                this.asset_record.file_size = stat.size
                this.asset_record.identifiers.push(this.imf_xml_id())
                this.update_common_asset_properties(file_path)
                resolve(this.asset_record)
                return
            }

            let parse = new mxf_parser(this.buf)
            if (parse.is_mxf()) {
                this.asset_record.file_size = stat.size
                this.asset_record.identifiers.push(parse.get_track_file_id_string())
                this.asset_record.file_type = file_type.alias.mxf
                //now check to see if we can extract a known file descriptor
                //let mxf_coding = parse.get_essence_coding()
                this.update_common_asset_properties(file_path)
                resolve(this.asset_record)
                return
            }
            resolve(false)
        })
    }
    /**return the hash_table
     * @returns {Array} an array of has ID-hash value associations:
     * ```
     * hash_table[n].id = 'urn:uuid:f234296b-25ee-4b0e-ba0f-099c5f161d51'
     * hash_table[n].hash_hex_str = 'b742938681fcb6267657d3698b5d064e8af5c3f2'
     * hash_table[n].hash_algorithm = 'http://www.w3.org/2000/09/xmldsig#sha1'
     * ```
     */
    get_hash_table() {
        return this.hash_table
    }
}