
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

//synthesise the buttons
let table_id = "admin-button-table"
let response_element_id = "api_res"

let rows = make_admin_buttons(response_element_id)
for (row in rows){
    document.getElementById(table_id).appendChild( rows[row] )
}
