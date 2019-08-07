var update_div_from_api = function (element_id, mode, url) {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
        if (this.readyState == 4) {
            msg = xhr.responseText
            num_assets=false
            if (('{' == xhr.responseText.substr(0, 1)) || ('[' == xhr.responseText.substr(0, 1))) {
                //pretty print the JSON
                msg = JSON.parse(msg)
                num_assets = msg.length
                num_assets = (msg.results) ? msg.results.length : num_assets
                msg = `<pre>${JSON.stringify(msg, undefined, 2)}</pre>`
            }
            // Typical action to be performed when the document is ready:
            document.getElementById(element_id).innerHTML =
                `<strong>Status</strong>: ${this.status}` +
                `<br><strong>URL</strong>: ${xhr.responseURL}` +
                ((num_assets) ? `<br><strong>results</strong>: ${num_assets}` : '') +
                '<div id="api_res" style="border: solid 1px #9A3A73;padding:1px;">' + 
                `<br>${msg}</div><br>`
        }
    };
    xhr.open(mode, url, true);
    document.getElementById(element_id).innerHTML = mode + url;
    xhr.send();
}

let get_app_info = function () {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
        if (this.readyState == 4) {
            app_info = xhr.responseText
        }
    };
    //don't wait for the response of the call
    xhr.open("GET", "info", true);
    document.getElementById(the_div).innerHTML = "GET " + get_api;
    xhr.send();
}

let synth = function (opt) {
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
    button.addEventListener('click', function(){ update_div_from_api(opt.element_id, opt.mode, opt.url) })
    button.innerHTML = `${opt.mode} ${opt.url} `
    button_cell.appendChild(button)
    //button styles: bootstrap default to match  swaggerhub default
    let button_style = {
        GET:'btn-primary',
        PUT:'btn-warning',
        POST:'btn-success',
        DELETE:'btn-danger',
    }
    button.setAttribute('class', button_style[opt.mode])
    row.appendChild(button_cell)
    return row
}

let make_test_buttons = function () {
    let api_prefix = "/dev"
    let element_id = "api_res"
    let rows = []
    let cpl_id = 'urn:uuid:f234296b-25ee-4b0e-ba0f-099c5f161d51'

    rows.push(synth({
        label: "GET the home page",
        mode: "GET",
        url: '/',
        element_id: element_id,
        help: 'should return the website home page to prove script is working',
    }))
    rows.push(synth({
        label: "Get all assets",
        mode: "GET",
        url: `${api_prefix}/assets`,
        element_id: element_id,
        help: 'should return first page of assets using default paging',
    }))
    rows.push(synth({
        label: "Get 2nd & 3rd assets",
        mode: "GET",
        url: `${api_prefix}/assets?skip=1&limit=2`,
        element_id: element_id,
        help: 'should return all the assets using default paging',
    }))
    rows.push(synth({
        label: "Get CPL by ID",
        mode: "GET",
        url: `${api_prefix}/assets/${cpl_id}`,
        element_id: element_id,
        help: 'should return just one asset record',
    }))
    return rows
}
//synthesise the buttons
let table_div = "api-button-table"
let rows = make_test_buttons()
for (row in rows){
    document.getElementById(table_div).appendChild( rows[row] )
}

let old_htm = document.getElementById(table_div).innerHTML
//document.getElementById(table_div).innerHTML = old_htm + old_make_test_buttons()
