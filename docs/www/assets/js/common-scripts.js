var update_div_from_api = function (element_id, mode, url) {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
        if (this.readyState == 4) {
            msg = xhr.responseText
            num_assets = false
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
            let inf = JSON.parse(xhr.responseText)
            let h1 = document.getElementById('mode_info')
            if (h1) {
                h1.innerHTML = `<span style="font-size:50%">(${inf.app_name} v${inf.app_version} in ${inf.node_env} mode)</span>`
            }
        }
    };
    //wait for the response of the call
    xhr.open("GET", "/admin/info", true);
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
    button.addEventListener('click', function () { update_div_from_api(opt.element_id, opt.mode, opt.url) })
    button.innerHTML = `${opt.mode} ${opt.url} `
    button_cell.appendChild(button)
    //button styles: bootstrap default to match  swaggerhub default
    let button_style = {
        GET: 'btn-primary',
        PUT: 'btn-warning',
        POST: 'btn-success',
        DELETE: 'btn-danger',
    }
    button.setAttribute('class', button_style[opt.mode])
    row.appendChild(button_cell)
    return row
}

get_app_info()
