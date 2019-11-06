const demo = {}

demo.update_div_from_api = function (element_id, mode, url, payload) {
    if (demo.close_danger_modal) {
        //close and modal dialog
        demo.close_danger_modal()
    }
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
        if (this.readyState == 4) {
            // if there is an etag then remember it
            demo.etag = xhr.getResponseHeader('etag')
            msg = xhr.responseText
            num_assets = false
            if (('{' == xhr.responseText.substr(0, 1)) || ('[' == xhr.responseText.substr(0, 1))) {
                //pretty print the JSON
                msg = JSON.parse(msg)
                num_assets = msg.length
                num_assets = (msg.results) ? msg.results.length : num_assets
                demo.total_results = (msg.total) ? msg.total : demo.total_results
                msg = `<pre>${JSON.stringify(msg, undefined, 2)}</pre>`
            }
            let mclass = ' class="api500"'
            if (this.status < 500) mclass = ' class="api400"'
            if (this.status < 400) mclass = ' class="api300"'
            if (this.status < 300) mclass = ' class="api200"'
            if (this.status < 200) mclass = ' class="api100"'

            // Typical action to be performed when the document is ready:
            document.getElementById(element_id).innerHTML =
                `<strong>Status</strong>: <span ${mclass}>${this.status} (${this.statusText})</span><br>` +
                `<strong>URL</strong>: ${xhr.responseURL}` +
                ((num_assets) ? `<br><strong>results</strong>: ${num_assets}` : '') +
                `<pre id="${demo.response_headers_id}">${xhr.getAllResponseHeaders()}</pre>` +
                `<div id="${demo.response_body_id}">${msg}</div><br>`
        }
    };
    //the fake_put mode is to test the 428 error response
    let real_method = ("fake_put" == mode.toLowerCase()) ? `PUT`: mode

    //construct the http request
    xhr.open(real_method, url, true);

    //update the page while we wait for the response
    document.getElementById(element_id).innerHTML = mode + url

    //put requests use the most recent etag to avoid collisions
    if (mode.toLowerCase() == "put") {
        xhr.setRequestHeader('If-Match', demo.etag)
    }

    //add payloads for PUT and POST requests
    if (payload) {
        xhr.setRequestHeader('Content-type', 'application/json');
        xhr.send(JSON.stringify(payload))
    } else (
        xhr.send()
    )
}

demo.get_data = function (url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
        if (this.readyState == 4) {
            msg = xhr.responseText
            callback(msg)
        }
    };
    xhr.open('GET', url, true);
    xhr.send();
}

demo.get_app_info = async () => {
    var xhr = new XMLHttpRequest()

    return new Promise((resolve, reject) => {
        xhr.onreadystatechange = function () {
            if (this.readyState == 4) {
                let inf = JSON.parse(xhr.responseText)
                demo.info = inf
                for (let z = 0; z < demo.overwrite_with_mode.length; z++) {
                    let thing = document.getElementById(demo.overwrite_with_mode[z])
                    if (thing) {
                        thing.innerHTML += ` <span style="font-size:0.4em;">${inf.app_name} ` +
                            `v<span class="mm-highlight">${inf.app_version}</span>,` +
                            ` in <span class="mm-highlight">${inf.node_env}</span> mode,` +
                            ` <span class="mm-highlight">${inf.db_type}</span> DB` +
                            ((inf.git_url) ? ` <a href="${inf.git_url}" target="_blank" class="mm-highlight">GitHub</a>` : '') +
                            `</span>`
                    }
                }
                resolve(demo.info)
            }
        };
        //wait for the response of the call
        xhr.open("GET", "admin/info", true);
        xhr.send();
    })
}

demo.get_readme = async () => {
    var xhr = new XMLHttpRequest();

    return new Promise((resolve, reject) => {
        xhr.onreadystatechange = function () {
            if (this.readyState == 4) {
                demo.readme = xhr.responseText
                resolve(demo.readme)
            }
        };
        //wait for the response of the call
        xhr.open("GET", "admin/readme", true);
        xhr.send();
    })
}

demo.get_test_data = async () => {
    return new Promise((resolve, reject) => {
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function () {
            if (this.readyState == 4) {
                let data = JSON.parse(xhr.responseText)
                resolve(data)
            }
        };
        //wait for the response of the call
        xhr.open("GET", "r/js/test-records.json", true);
        xhr.send();
    })
}

demo.get_non_crawl_data = async () => {
    return new Promise((resolve, reject) => {
        var xhr = new XMLHttpRequest()
        xhr.open("GET", "r/js/put-post-records.json", true);
        xhr.onreadystatechange = function () {
            if (this.readyState == 4) {
                let data = JSON.parse(xhr.responseText)
                resolve(data)
            }
        }
        //wait for the response of the call
        xhr.send();
    })
}

/** this function is the standards button handler - it is removed for special buttons */
demo.fn_update_div = function () { demo.update_div_from_api(opt.element_id, opt.mode, opt.url, opt.data) }

demo.synth = function (opt) {
    if (opt.brk) {
        let row = document.createElement('tr')
        let line = document.createElement('hr')
        line.setAttribute('style', 'height:1;width:95%;margin:3px;')
        let lcell = document.createElement('td')
        lcell.setAttribute('colspan', 2)
        lcell.appendChild(line)
        row.appendChild(lcell)
        return row
    }
    //tr
    let row = document.createElement('tr')
    //td - label
    let label_cell = document.createElement('td')
    label_cell.setAttribute('align', 'right')
    label_cell.innerHTML = opt.label
    row.appendChild(label_cell)
    //td - button
    let button_cell = document.createElement('td')
    button_cell.setAttribute('align', 'left')
    let button = document.createElement('button')
    if (opt.eventListener) {
        button.addEventListener('click', opt.eventListener)
    } else {
        button.addEventListener('click', function () { demo.update_div_from_api(opt.element_id, opt.mode, opt.url, opt.data) })
    }
    if (opt.mode.toLowerCase() == "fake_put") {
        button.innerHTML = `PUT ${opt.url} `
    } else {
        button.innerHTML = `${opt.mode} ${opt.url} `
    }
    button_cell.appendChild(button)
    if (opt.id) {
        button.setAttribute('id', opt.id)
    }
    let help_text = document.createElement('span')
    help_text.setAttribute('style', 'font-size:75%;font-style:italic;')
    help_text.innerHTML = ` ${opt.help}`
    button_cell.appendChild(help_text)
    //button styles: bootstrap default to match  swaggerhub default
    let button_style = {
        GET: 'btn-primary',
        FAKE_PUT: 'btn-warning',
        PUT: 'btn-warning',
        POST: 'btn-success',
        DELETE: 'btn-danger',
    }
    button.setAttribute('class', button_style[opt.mode])
    row.appendChild(button_cell)
    return row
}

demo.total_results = 20

demo.overwrite_with_mode = ['mode_info',]
demo.button_table_id = 'button-table'
demo.response_body_id = 'api_res_body'
demo.response_headers_id = 'api_headers'
demo.response_id = 'api_res'

//each page has its own script module that defines @async init_page()
//@init_page() is executed as the last element in the HTNL page - poor man's race condition avoidance
