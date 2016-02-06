define([
    'jquery',
    'base/js/namespace',
    '../utils',
    './templates/share_button.jade',
    './templates/share_dialog.jade',
    'base/js/dialog'],
    function(
        $,
        Jupyter,
        utils,
        share_button,
        share_dialog,
        dialog
) {
    var load_share_button = function() {
        $(function() {
            $('#header-container').append(share_button());

            $('.jupyternow-share').click(function() {
                var body = $(share_dialog());
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
                        };
                        var server_slug = utils.get_server_slug();
                        var url = '/api/s/'+server_slug+'/invitations';
                        var notif = Jupyter.notification_area.get_widget('notebook');

                        notif.set_message('Sharing..');
                        $.ajax({
                            type: "POST",
                            url: url,
                            data: JSON.stringify(data),
                            contentType: 'application/json'
                        }).done(function () {notif.info('Shared', 1000);})
                          .fail(function () {notif.warning('Failed sharing', 1000);});
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
    return {
        install: load_share_button
    };
});
