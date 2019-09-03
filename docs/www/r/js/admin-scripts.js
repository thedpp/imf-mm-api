demo.delete_eventListener = () => {
    let btn = document.getElementById('delete_button')
    let modal = document.getElementById('danger_modal')
    modal.style.display = "block"
}
demo.close_danger_modal = () => {
    let modal = document.getElementById('danger_modal')
    modal.style.display = "none"
}
// When the user clicks anywhere outside of the modal, close it
window.onclick = function (event) {
    let modal = document.getElementById('danger_modal')
    if (event.target == modal) {
        close_danger_modal()
    }
}

demo.make_admin_buttons = function (response_element_id) {
    let rows = []

    rows.push(demo.synth({
        label: "App info",
        mode: "GET",
        url: 'admin/info',
        element_id: response_element_id,
        help: 'get information about the running application',
    }))
    rows.push(demo.synth({
        label: "DB info",
        mode: "GET",
        url: 'admin/db-info',
        element_id: response_element_id,
        help: 'get information about the current database',
    }))
    rows.push()
    rows.push(demo.synth({
        id: 'delete_button',
        label: "Reset the database (DANGER)",
        mode: "DELETE",
        url: `admin/db`,
        element_id: response_element_id,
        help: 'DANGER - this cannot be undone',
        eventListener: demo.delete_eventListener,
    }))

    //tr
    let row = document.createElement('tr')
    //td - label
    let cell = document.createElement('td')
    cell.setAttribute('colspan', 2)
    row.appendChild(cell)

    let danger_modal = document.createElement('div')
    danger_modal.setAttribute('id', 'danger_modal')
    danger_modal.setAttribute('class', 'modal')

    let modal_body = document.createElement('div')
    modal_body.setAttribute('class', 'modal-content')

    let close_button = document.createElement('span')
    close_button.innerHTML = '&times;'
    close_button.setAttribute('class', 'close')
    close_button.setAttribute('style', 'width:100%;')
    close_button.setAttribute('id', 'danger_modal_close')
    close_button.addEventListener('click', demo.close_danger_modal)

    let text = document.createElement('p')
    text.innerHTML = "<strong>DANGER</strong> - this cannot be undone.<br>An empty database will be recreated!<br>Are You Sure?"

    let yes_button = demo.synth({
        label: "Re-Init database",
        mode: "DELETE",
        url: `admin/db`,
        element_id: response_element_id,
        help: 'DANGER - this cannot be undone',
    })
    let no_button = demo.synth({
        label: "nope",
        mode: "CLOSE",
        url: ``,
        element_id: response_element_id,
        help: 'nope - take me back',
        eventListener: demo.close_danger_modal,
    })
    let button_table = document.createElement('table')
    button_table.appendChild(yes_button)
    button_table.appendChild(no_button)

    modal_body.appendChild(close_button)
    modal_body.appendChild(text)
    modal_body.appendChild(button_table)

    danger_modal.appendChild(modal_body)
    row.appendChild(danger_modal)
    rows.push(row)

    return rows
}

const init_page = async () => {
    await demo.get_app_info()

    //synthesise the buttons
    let response_element_id = demo.response_id

    let rows = demo.make_admin_buttons(response_element_id)
    for (let row in rows) {
        document.getElementById(demo.button_table_id).appendChild(rows[row])
    }
}