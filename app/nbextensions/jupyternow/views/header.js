define([
    'jquery',
    'base/js/namespace',
    '../utils',
    './templates/header.jade',
    './templates/header-control.jade'
], function($, Jupyter, util, header_tpl, headerControl_tpl) {
    var install = function() {
        $(function() {
            $("#ipython_notebook").remove();
            if(!Jupyter.notebook) {
                $("#header").remove();
            }
            $('body').prepend(header_tpl());
            $('.jupyternow-header').hide().slideDown();
        });

        $.get('/api/me').done(function(data) {
            var slug = util.get_server_slug();
            var thisServer = _.find(data.servers, function(server) {
                return server.slug == slug;
            });
            thisServer.active = true;

            data.servers = _.map(data.servers, function(server) {
                server.url = '/s/'+server.slug;
                return server;
            });

            data.thisServer = thisServer;
            var html = headerControl_tpl(data);
            $('.jupyternow-header .navbar-right').append(html);
        });
    };
    return {
        install: install
    };
});
