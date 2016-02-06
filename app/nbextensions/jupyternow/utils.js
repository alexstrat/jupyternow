define(function() {
    var load_css = function (url) {
        var link = document.createElement("link");
        link.type = "text/css";
        link.rel = "stylesheet";
        link.href = url;
        link.id = "jupyternow-css";
        document.getElementsByTagName("head")[0].appendChild(link);
    };

    var get_server_slug = function() {
        var m = window.location.pathname.match("\/s\/(.[^/]+)\/.*");
        return m[1];
    };


    return {
        load_css: load_css,
        get_server_slug: get_server_slug
    };

});
