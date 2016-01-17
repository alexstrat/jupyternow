var config = require('../../config/config'),
    sendwithus = require('sendwithus')(config.SendWithUs.ApiKey),
    Promise = require('bluebird');

sendwithus = Promise.promisifyAll(sendwithus);

exports.sendInvitation = function(invitation) {
    console.log(invitation.invitee_email);
    return sendwithus.sendAsync({
        email_id: 'tem_JtDbLH7z8YfShFyCoaxyqc',
        recipient: {
            address: invitation.invitee_email
        },
        sender: {
            name: invitation.inviter.full_name,
            address: 'no-reply@jupyternow.co'
        },
        email_data: {
            inviter: {
                full_name: invitation.inviter.full_name
            },
            notebook: {
                name: invitation.notebook.name,
                // fix me; get absolute URL
                url: invitation.notebook.path
            }
        }
    }).catch(function(err) {
        console.log(err);
        return err;
    });
};
