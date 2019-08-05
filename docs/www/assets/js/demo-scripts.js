var update_div_from_api = function (the_div, mode, url) {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
        if (this.readyState == 4) {
            msg = xhr.responseText
            if (('{' == xhr.responseText.substr(0, 1)) || ('[' == xhr.responseText.substr(0, 1))) {
                //pretty print the JSON
                msg = JSON.parse(msg)
                msg = JSON.stringify(msg, undefined, 2)
            }
            // Typical action to be performed when the document is ready:
            document.getElementById(the_div).innerHTML =
                "Status: " + this.status +
                "<br>URL: " + xhr.responseURL +
                "<br>" + msg;
        }
    };
    xhr.open(mode, url, true);
    document.getElementById(the_div).innerHTML = mode + url;
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

let old_synth = function (opt) {
    return (
        '<tr><td align="right">' + opt.label + '</td>' +
        '<td align="left">' +
        '<button class="btn-default" onClick="update_div_from_api("' + opt.output_div + '","' + opt.url + '")>' +
        opt.text +
        '</button>' +
        opt.help +
        '</td></tr>')

}
let synth = function (opt) {
    let row = document.createElement('tr')
    let label_cell = document.createElement('td')
    label_cell.setAttribute('align', 'right')
    label_cell.innerHTML = opt.label
    row.appendChild(label_cell)
    let button_cell = document.createElement('td')
    button_cell.setAttribute('align', 'right')
    let button = document.createElement('button')
    button.setAttribute('class', 'btn-default')
    button.addEventListener('click', function(){ update_div_from_api(opt.output_div, opt.mode, opt.url) })
    button.innerHTML = opt.text
    button_cell.appendChild(button)
    row.appendChild(button_cell)
    return row
}
let old_make_test_buttons = function () {
    let htm = ""
    //prefix can be dev or staging or whatever...
    let pf = "dev"
    let opdiv = "api_res"

    return old_synth({
        label: "Get all assets",
        text: "GET /",
        mode: "GET", prefix: pf, output_div: opdiv,
        help: 'should return the website home page to prove script is working',
    })
}
let make_test_buttons = function () {
    let pf = "dev"
    let opdiv = "api_res"
    return synth({
        label: "Get all assets",
        text: "GET /",
        mode: "GET", prefix: pf, output_div: opdiv,
        help: 'should return the website home page to prove script is working',
    })
}
//synthesise the buttons
let table_div = "api-button-table"
let rows = make_test_buttons()
document.getElementById(table_div).appendChild( rows )

let old_htm = document.getElementById(table_div).innerHTML
//document.getElementById(table_div).innerHTML = old_htm + old_make_test_buttons()
