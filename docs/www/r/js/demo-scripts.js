let make_demo_buttons = function (response_element_id, data) {
    let rows = []

    //find the first CPL in the given data
    let cpl_id, cpl_sha
    let d = 0
    do {
        asset = data.test[d++]
        if (asset.locations[0].indexOf('CPL') > 0) {
            cpl_id = asset.identifiers[0]
            cpl_sha = asset.identifiers[1]
        }
    } while ((d < data.test.length) && !cpl_id)
    // = 'urn:uuid:f234296b-25ee-4b0e-ba0f-099c5f161d51'

    let post1 = data.pp[0]
    let post2 = data.pp[4]

    rows.push(synth({
        label: "home page",
        mode: "GET",
        url: '/',
        element_id: response_element_id,
        help: 'return the website home page to prove script is working',
    }))
    rows.push(synth({
        label: "all assets",
        mode: "GET",
        url: `${api_prefix}/assets`,
        element_id: response_element_id,
        help: 'return first page of assets using default paging (defined in config file)',
    }))
    rows.push(synth({
        label: "all assets",
        mode: "GET",
        url: `${api_prefix}/assets?limit=200`,
        element_id: response_element_id,
        help: 'return first page of assets - up to 200 assets',
    }))
    rows.push(synth({
        id: 'paging_button',
        label: "assets (paging)",
        mode: "GET",
        url: `${api_prefix}/assets?skip=1&limit=2`,
        element_id: response_element_id,
        help: ' return all the assets using default paging',
    }))
    rows.push(synth({
        label: "CPL by ID",
        mode: "GET",
        url: `${api_prefix}/assets/${cpl_id}`,
        element_id: response_element_id,
        help: 'return matching record',
    }))
    rows.push(synth({
        label: "CPL by hash",
        mode: "GET",
        url: `${api_prefix}/assets/${cpl_sha}`,
        element_id: response_element_id,
        help: 'return matching record',
    }))
    rows.push(synth({
        label: "<span class='api400'>missing asset</span>",
        mode: "GET",
        url: `${api_prefix}/assets/urn:uuid:11111111-2222-3333-4444-555555555555`,
        element_id: response_element_id,
        help: 'search for asset that is not there',
    }))

    rows.push(synth({
        label: "add asset #P1",
        mode: "POST",
        url: `${api_prefix}/assets/`,
        element_id: response_element_id,
        help: 'create an asset P1 - POSTing twice should not create multiple assets',
        data: post1,
    }))
    rows.push(synth({
        label: "get #P1 by ID",
        mode: "GET",
        url: `${api_prefix}/assets/${post1.identifiers[0]}`,
        element_id: response_element_id,
        help: ' return just one asset record',
    }))
    rows.push(synth({
        label: "add asset #P2",
        mode: "POST",
        url: `${api_prefix}/assets/`,
        element_id: response_element_id,
        help: 'create an asset P2 - POSTing twice should not create multiple assets',
        data: post2,
    }))
    rows.push(synth({
        label: "get #P2 by ID",
        mode: "GET",
        url: `${api_prefix}/assets/${post2.identifiers[0]}`,
        element_id: response_element_id,
        help: ' return just one asset record',
    }))

    rows.push(synth({
        label: "delete #P1",
        mode: "DELETE",
        url: `${api_prefix}/assets/${post1.identifiers[0]}`,
        element_id: response_element_id,
        help: 'delete asset P1',
        data: post1,
    }))
    rows.push(synth({
        label: "delete #P2",
        mode: "DELETE",
        url: `${api_prefix}/assets/${post2.identifiers[0]}`,
        element_id: response_element_id,
        help: 'delete asset P2',
        data: post2,
    }))
    rows.push(synth({
        label: "<span class='api400'>delete missing</span>",
        mode: "DELETE",
        url: `${api_prefix}/assets/urn:uuid:11111111-2222-3333-4444-555555555555`,
        element_id: response_element_id,
        help: 'delete an asset that does not exist',
        data: post2,
    }))
    return rows
}

let paging_button_callback = () => {
    let btn = document.getElementById('paging_button')
    let url = `${api_prefix}/assets?skip=${data.skip}&limit=${data.limit}`
    update_div_from_api(response_element_id, 'GET', url, '')
    data.skip += data.limit
    url = `${api_prefix}/assets?skip=${data.skip}&limit=${data.limit}`
    btn.innerHTML = `GET ${url} `
}

//synthesise the buttons
let table_id = "api-button-table"
let response_element_id = "api_res"
let api_prefix = "/dev"

//data is defined in common_scripts
data.skip = 1
data.limit = 2

get_test_data((test_data) => {
    data.test = test_data
    get_put_post_data((pp_data) => {
        data.pp = pp_data
        let rows = make_demo_buttons(response_element_id, data)
        for (let row in rows) {
            document.getElementById(table_id).appendChild(rows[row])
        }
        // add a special function for the paging button
        let paging_button = document.getElementById('paging_button')
        paging_button.addEventListener('click', paging_button_callback)

    })
})
// urn:uuid:3c6102bf-7049-4d13-be87-bff2544d920b
// urn:uuid:3c6102bf-7049-4d13-be87-bff2544d920b
// urn:uuid:3c6102bf-7049-4d13-be87-bff2544d920b