let make_demo_buttons = function (response_element_id) {
    let api_prefix = "/dev"
    let rows = []
    let cpl_id = 'urn:uuid:f234296b-25ee-4b0e-ba0f-099c5f161d51'

    rows.push(synth({
        label: "GET the home page",
        mode: "GET",
        url: '/',
        element_id: response_element_id,
        help: 'should return the website home page to prove script is working',
    }))
    rows.push(synth({
        label: "Get all assets",
        mode: "GET",
        url: `${api_prefix}/assets`,
        element_id: response_element_id,
        help: 'should return first page of assets using default paging',
    }))
    rows.push(synth({
        label: "Get 2nd & 3rd assets",
        mode: "GET",
        url: `${api_prefix}/assets?skip=1&limit=2`,
        element_id: response_element_id,
        help: 'should return all the assets using default paging',
    }))
    rows.push(synth({
        label: "Get CPL by ID",
        mode: "GET",
        url: `${api_prefix}/assets/${cpl_id}`,
        element_id: response_element_id,
        help: 'should return just one asset record',
    }))
    return rows
}

//synthesise the buttons
let table_id = "api-button-table"
let response_element_id = "api_res"

let rows = make_demo_buttons(response_element_id)
for (row in rows){
    document.getElementById(table_id).appendChild( rows[row] )
}
