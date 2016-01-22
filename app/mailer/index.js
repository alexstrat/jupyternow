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
            name: invitation.inviter.displayName,
            address: 'no-reply@jupyternow.co'
        },
        email_data: {
            inviter: {
                displayName: invitation.inviter.displayName
            },
            notebook: {
                name: invitation.notebook.name,
                url: invitation.notebook.absoluteURL
            }
        }
    }).catch(function(err) {
        return err;
    });
};
