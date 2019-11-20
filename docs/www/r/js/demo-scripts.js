demo.paging_button_eventListener = async () => {
    let btn = document.getElementById('paging_button')
    let url = `${demo.info.api_prefix}/assets?skip=${demo.skip}&limit=${demo.limit}`
    demo.update_div_from_api(demo.response_id, 'GET', url, '')
    demo.skip += demo.limit
    url = `${demo.info.api_prefix}/assets?skip=${demo.skip}&limit=${demo.limit}`
    btn.innerHTML = `GET ${url} `
}

demo.put_button_eventListener = async () => {
    let btn = document.getElementById('put_button')
    let url = `${demo.info.api_prefix}/assets/${demo.put_asset1.identifiers[0]}`
    demo.put_asset1.file_type = `MODIFIED RND(${Math.floor(1000000 * Math.random())})`
    demo.update_div_from_api(demo.response_id, 'PUT', url, demo.put_asset1)
}

demo.make_demo_buttons = function (response_element_id, data) {
    let rows = [
        demo.synth({
            label: "home page",
            mode: "GET",
            url: '',
            element_id: response_element_id,
            help: 'return the website home page to prove script is working',
        })
    ]

    /* --------------------------------------------------------------------------------- */
    rows.push(demo.synth({ brk: 1, }))
    /* --------------------------------------------------------------------------------- */

    rows = rows.concat([
        demo.synth({
            label: "all assets",
            mode: "GET",
            url: `${demo.info.api_prefix}/assets`,
            element_id: response_element_id,
            help: `return first page of assets using default paging (defined in ${demo.info.node_env} config file)`,
        }),
        demo.synth({
            label: "all assets",
            mode: "GET",
            url: `${demo.info.api_prefix}/assets?limit=500`,
            element_id: response_element_id,
            help: 'return first page of assets - up to 500 assets',
        }),
        demo.synth({
            id: 'paging_button',
            label: "assets (paging)",
            mode: "GET",
            url: `${demo.info.api_prefix}/assets?skip=${demo.skip}&limit=${demo.limit}`,
            element_id: response_element_id,
            help: ` page all the assets ${demo.limit} at a time`,
            eventListener: demo.paging_button_eventListener,
        }),
        demo.synth({
            id: 'cpl_assets',
            label: "CPL assets",
            mode: "GET",
            url: `${demo.info.api_prefix}/assets?[file-type]=ft.cpl`,
            element_id: response_element_id,
            help: ` list assets with the CPL type`
        }),
        demo.synth({
            id: 'cpl_pkl_assets',
            label: "CPL and PKL assets",
            mode: "GET",
            url: `${demo.info.api_prefix}/assets?[file-type]=ft.cpl&[file-type]=ft.pkl`,
            element_id: response_element_id,
            help: ` list assets with the CPL and PKL type`
        })
    ])

    /* --------------------------------------------------------------------------------- */
    rows.push(demo.synth({ brk: 1, }))
    /* --------------------------------------------------------------------------------- */

    rows = rows.concat([
        demo.synth({
            label: "CPL by ID",
            mode: "GET",
            url: `${demo.info.api_prefix}/assets/${demo.cpl_id}`,
            element_id: response_element_id,
            help: 'return matching record',
        }),
        demo.synth({
            label: "CPL by hash",
            mode: "GET",
            url: `${demo.info.api_prefix}/assets/${demo.cpl_sha}`,
            element_id: response_element_id,
            help: 'return matching record',
        }),
        demo.synth({
            label: "<span class='api400'>missing asset</span>",
            mode: "GET",
            url: `${demo.info.api_prefix}/assets/urn:uuid:11111111-2222-3333-4444-555555555555`,
            element_id: response_element_id,
            help: 'search for asset that is not there and return an error',
        })
    ])

    /* --------------------------------------------------------------------------------- */
    rows.push(demo.synth({ brk: 1, }))
    /* --------------------------------------------------------------------------------- */

    rows = rows.concat([
        demo.synth({
            label: "add asset #P1",
            mode: "POST",
            url: `${demo.info.api_prefix}/assets/`,
            element_id: response_element_id,
            help: 'create an asset P1 - POSTing twice should not create multiple assets',
            data: demo.post_asset1,
        }),
        demo.synth({
            label: "get #P1 by ID",
            mode: "GET",
            url: `${demo.info.api_prefix}/assets/${demo.post_asset1.identifiers[0]}`,
            element_id: response_element_id,
            help: ' return just one asset record',
        }),
        //the put request uses the most recent etag in the header
        demo.synth({
            id: 'put_button',
            label: "get #P1 by ID",
            mode: "PUT",
            url: `${demo.info.api_prefix}/assets/${demo.put_asset1.identifiers[0]}`,
            element_id: response_element_id,
            help: ' update a asset #P1. GET the right asset first!!',
            data: demo.put_asset1,
            eventListener: demo.put_button_eventListener,
        }),
        demo.synth({
            label: "delete #P1",
            mode: "DELETE",
            url: `${demo.info.api_prefix}/assets/${demo.post_asset1.identifiers[0]}`,
            element_id: response_element_id,
            help: 'delete asset P1',
        })
    ])

    /* --------------------------------------------------------------------------------- */
    rows.push(demo.synth({ brk: 1, }))
    /* --------------------------------------------------------------------------------- */

    rows = rows.concat([
        demo.synth({
            label: "add asset #P2",
            mode: "POST",
            url: `${demo.info.api_prefix}/assets/`,
            element_id: response_element_id,
            help: 'create an asset P2 - POSTing twice should not create multiple assets',
            data: demo.post_asset2,
        }),
        demo.synth({
            label: "get #P2 by ID",
            mode: "GET",
            url: `${demo.info.api_prefix}/assets/${demo.post_asset2.identifiers[0]}`,
            element_id: response_element_id,
            help: ' return just one asset record',
        }),
        //this put request will always error because of no if-match header
        demo.synth({
            label: "get #P2 by ID",
            mode: "FAKE_PUT",
            url: `${demo.info.api_prefix}/assets/${demo.post_asset2.identifiers[0]}`,
            element_id: response_element_id,
            help: ' fail because of no If-Match header',
            data: demo.post_asset2,
        }),
        demo.synth({
            label: "delete #P2",
            mode: "DELETE",
            url: `${demo.info.api_prefix}/assets/${demo.post_asset2.identifiers[0]}`,
            element_id: response_element_id,
            help: 'delete asset P2',
        }),
        demo.synth({
            label: "<span class='api400'>delete missing</span>",
            mode: "DELETE",
            url: `${demo.info.api_prefix}/assets/urn:uuid:11111111-2222-3333-4444-555555555555`,
            element_id: response_element_id,
            help: 'delete an asset that does not exist',
        })
    ])

    /* --------------------------------------------------------------------------------- */
    rows.push(demo.synth({ brk: 1, }))
    /* --------------------------------------------------------------------------------- */

    return rows
}

const init_page = async () => {
    //pull in the run-time configuration
    await demo.get_app_info()

    demo.skip = 7
    demo.limit = 3

    //pull in the data from the assets in the __test__ folder
    demo.non_crawl_data = await demo.get_non_crawl_data()
    demo.db_data = await demo.get_test_data()

    //find the first CPL in the given data
    let d = 0
    do {
        asset = demo.db_data[d++]
        if (asset.locations[0].indexOf('CPL') > 0) {
            demo.cpl_id = asset.identifiers[0]
            demo.cpl_sha = asset.identifiers[1]
        }
    } while ((d < demo.db_data.length) && !demo.cpl_id)

    demo.post_asset1 = demo.non_crawl_data[1]
    demo.post_asset2 = demo.non_crawl_data[6]

    demo.put_asset1 = JSON.parse(JSON.stringify(demo.post_asset1))
    demo.put_asset1.file_type = "MODIFIED"

    //demo.synthesise the buttons
    let response_element_id = demo.response_id

    let rows = demo.make_demo_buttons(response_element_id)
    for (let row in rows) {
        document.getElementById(demo.button_table_id).appendChild(rows[row])
    }
}