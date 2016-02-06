require.config({
    paths: {
        'jade': "https://cdnjs.cloudflare.com/ajax/libs/jade/1.11.0/runtime"
    }
});

define([
    'require',
    'base/js/namespace',
    './utils',
    './views/share_button',
    './views/header'
], function(
    require,
    Jupyter,
    utils,
    share_button,
    header
) {


    function load_ipython_extension() {

        utils.load_css(require.toUrl("./main.css"));

        if(Jupyter.notebook) {
            // if not in notebook mode, no share button
            share_button.install();
        }

        header.install();
    }

    return {
        load_ipython_extension: load_ipython_extension
    };
});
