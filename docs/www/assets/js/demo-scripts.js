let make_demo_buttons = function (response_element_id, data) {
    let api_prefix = "/dev"
    let rows = []
    let cpl_id = 'urn:uuid:f234296b-25ee-4b0e-ba0f-099c5f161d51'

    let post1 = data[0]
    let post2 = data[4]

    rows.push(synth({
        label: "home page",
        mode: "GET",
        url: '/',
        element_id: response_element_id,
        help: 'should return the website home page to prove script is working',
    }))
    rows.push(synth({
        label: "all assets",
        mode: "GET",
        url: `${api_prefix}/assets`,
        element_id: response_element_id,
        help: 'should return first page of assets using default paging',
    }))
    rows.push(synth({
        label: "assets (paging)",
        mode: "GET",
        url: `${api_prefix}/assets?skip=1&limit=2`,
        element_id: response_element_id,
        help: 'should return all the assets using default paging',
    }))
    rows.push(synth({
        label: "asset by ID",
        mode: "GET",
        url: `${api_prefix}/assets/${cpl_id}`,
        element_id: response_element_id,
        help: 'should return just one asset record',
    }))

    rows.push(synth({
        label: "add asset #1",
        mode: "POST",
        url: `${api_prefix}/assets/`,
        element_id: response_element_id,
        help: 'should return just one asset record',
        data: post1,
    }))
    rows.push(synth({
        label: "add asset #2",
        mode: "POST",
        url: `${api_prefix}/assets/`,
        element_id: response_element_id,
        help: 'should return just one asset record',
        data: post2,
    }))
    return rows
}

//synthesise the buttons
let table_id = "api-button-table"
let response_element_id = "api_res"
get_test_data(function (data) {
    let rows = make_demo_buttons(response_element_id, data)
    for (row in rows) {
        document.getElementById(table_id).appendChild(rows[row])
    }
})