let make_crawl_buttons = function (response_element_id) {
    let rows = []

    rows.push(synth({
        label: "Initiate a crawl",
        mode: "POST",
        url: '/crawl/start',
        element_id: response_element_id,
        help: 'start a crawl',
    }))
    rows.push(synth({
        label: "Get crawl status",
        mode: "GET",
        url: `/crawl`,
        element_id: response_element_id,
        help: 'status of crawl',
    }))
    return rows
}


//synthesise the buttons
let table_id = "crawl-button-table"
let response_element_id = "api_res"

let rows = make_crawl_buttons(response_element_id)
for (row in rows){
    document.getElementById(table_id).appendChild( rows[row] )
}
