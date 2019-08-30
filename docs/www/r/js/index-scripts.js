const init_page = async() => {
    await demo.get_app_info()

    let markdown = document.getElementById('markdown-rendered-to-html-then-hidden-on-page-load')
    let html_out = document.getElementById('replaced-with-html-on-page-load')
    markdown.setAttribute('style', 'display:none;')
    html_out.innerHTML = marked(markdown.innerText)
}