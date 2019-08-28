
let make_admin_buttons = function (response_element_id) {
    let rows = []

    rows.push(synth({
        label: "App info",
        mode: "GET",
        url: '/admin/info',
        element_id: response_element_id,
        help: 'get information about the running application',
    }))
    rows.push(synth({
        label: "DB info",
        mode: "GET",
        url: '/admin/db-info',
        element_id: response_element_id,
        help: 'get information about the current database',
    }))
    rows.push(synth({
        label: "Reset the database",
        mode: "DELETE",
        url: `/admin/db`,
        element_id: response_element_id,
        help: 'DANGER - this cannot be undone',
    }))
    return rows
}

const init_page = async() => {
    await get_app_info()

    //synthesise the buttons
    let response_element_id = demo.response_id

    let rows = make_admin_buttons(response_element_id)
    for (let row in rows){
        document.getElementById(demo.button_table_id).appendChild( rows[row] )
    }
}