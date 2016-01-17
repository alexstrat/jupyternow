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
        email_data: {
            nb_link: invitation.notebook_path
        }
    }).catch(function(err) {
        console.log(err);
        return err;
    });
};
