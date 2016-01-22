define([
    'require',
    'base/js/namespace',
    'base/js/dialog'
], function(
    require,
    Jupyter,
    dialog
) {

    var getServerSlug = function() {
        var m = window.location.pathname.match("\/s\/(.[^/]+)\/.*");
        return m[1];
    }

    var load_css = function () {
        var link = document.createElement("link");
        link.type = "text/css";
        link.rel = "stylesheet";
        link.href = require.toUrl("./main.css");
        link.id = "jupyternow-css";
        document.getElementsByTagName("head")[0].appendChild(link);
    };

    var load_share_button = function() {
        $(function() {
            $("#header-container").append(shareButtonHTML);

            $('.jupyternow-share').click(function() {
                var body = $(shareDialogHTML);
                var emailInput = body.find('input[type="email"]');
                dialog.modal({
                   title: 'Share with others',
                   body: body,
                   buttons: { 'Done': {
                    class: 'btn-primary',
                    click: function() {
                        var email = emailInput.val();
                        var data = {
                            email: email,
                            notebook: {
                                path: Jupyter.notebook.notebook_path,
                                name: Jupyter.notebook.get_notebook_name()
                            }
                        }
                        var url = '/api/s/'+getServerSlug()+'/invitations';
                        var notif = Jupyter.notification_area.get_widget('notebook');

                        notif.set_message('Sharing..');
                        $.ajax({
                            type: "POST",
                            url: url,
                            data: JSON.stringify(data),
                            contentType: 'application/json'
                        }).done(function () {notif.info('Shared', 1000)})
                          .fail(function () {notif.warning('Failed sharing', 1000)})
                    }
                   }},
                   open: function() {
                        emailInput.focus().select();
                   },
                   notebook: Jupyter.notebook,
                   keyboard_manager: Jupyter.keyboard_manager
                });
            });
        });

    };

    var load_jupyternow_header = function() {
        $(function() {
            $("#ipython_notebook").remove();
            if(!Jupyter.notebook) {
                $("#header").remove()
            }
            $('body').prepend(headerHTML);
            $('.jupyternow-header').hide().slideDown()
        });
    }

    function load_ipython_extension() {

        load_css();

        if(Jupyter.notebook) {
            // if not in notebook mode, no share button
            load_share_button()
        }
        load_jupyternow_header();
    }


    // --- templates ----
    var headerHTML = [
    '<div class="jupyternow-header">',
    '    <div class="container">',
    '        <span class="title">Jupyternow</span>',
    '    </div>',
    '</div>'
    ].join("\n");

    var shareButtonHTML = [
    '<a class="btn btn-danger jupyternow-share">',
    '    Share',
    '</a>'
    ].join('\n');

    var shareDialogHTML = [
    '<div class="input-group input-group-lg">',
      '<span class="input-group-addon">@</span>',
      '<input type="email" class="form-control" placeholder="Enter email to share with">',
    '</div>'
    ].join("\n");

    return {
        load_ipython_extension: load_ipython_extension
    };
});
