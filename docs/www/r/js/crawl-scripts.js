demo.make_crawl_buttons = function (response_element_id) {
    let rows = []

    rows.push(demo.synth({
        label: "Initiate a crawl",
        mode: "POST",
        url: 'crawl/start',
        element_id: response_element_id,
        help: 'start a crawl',
    }))
    rows.push(demo.synth({
        label: "Get crawl status",
        mode: "GET",
        url: `crawl`,
        element_id: response_element_id,
        help: 'status of crawl',
    }))
    return rows
}

const init_page = async() => {
    await demo.get_app_info()

    //synthesise the buttons
    let response_element_id = demo.response_id

    let rows = demo.make_crawl_buttons(response_element_id)
    for (let row in rows){
        document.getElementById(demo.button_table_id).appendChild( rows[row] )
    }
}