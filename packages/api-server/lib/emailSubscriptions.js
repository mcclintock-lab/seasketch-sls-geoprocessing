const knex = require('./knex');
const AWS = require('aws-sdk');
var ses = new AWS.SES();


// TODO: Add some flair to these emails once there is a solid design language for seasketch-next

const htmlBody = (reportName, url, status, id) => {
  if (status === 'complete') {
    return `
Your report, "${reportName}" is ready for viewing on <a href="${url}">seasketch.org</a>.
`
  } else if (status === 'failed') {
    return `
Your report, "${reportName}" has failed. You can view the logs for this report on <a href="https://analysis.seasketch.org/invocations/detail/${id}">analysis.seasketch.org</a>.
`
  } else {
    throw new Error(`Don't know how to send email for unknown status ${status}`);
  }
}


const textBody = (reportName, url, status, id) => {
  if (status === 'complete') {
    return `
Your report, "${reportName}" is ready for viewing at ${url}.
`
  } else if (status === 'failed') {
    return `
Your report, "${reportName}" has failed. You can view the logs for this report at https://analysis.seasketch.org/invocations/detail/${id}.
`
  } else {
    throw new Error(`Don't know how to send email for unknown status ${status}`);
  }
}

const sendEmails = async () => {
  let ids;
  // Locking... I'm sure this will require debugging at some point
  // Basic steps are, grab email subscriptions that have a completed or failed invocation, setting locked = true in one step
  // for each of those, send out an email and if successful delete that record from the db
  // if the email send fails, unlock that subscription to be retried the next time around
  // if there is an exception at any point, unlock incomplete email subscription records. They will be processed on the next try
  try {
    const results = await knex.raw(`update email_subscriptions set locked = true from invocations where email_subscriptions.locked = false and invocations.uuid = email_subscriptions.invocation_id and (invocations.status = 'complete' or invocations.status = 'failed') returning invocations.uuid`)
    ids = results.rows.map((r) => r.uuid);
    const subscribers = await knex.from('emailSubscriptions').innerJoin('invocations', 'emailSubscriptions.invocationId', 'invocations.uuid').whereIn('emailSubscriptions.invocationId', ids);
    await knex('emailSubscriptions').update({locked: false}).whereIn('invocationId', ids);
    for (let subscriber of subscribers) {
      let sent = false;
      try {
        const { email, url, reportName, status, invocationId } = subscriber;
        var params = {
          Destination: { /* required */
            ToAddresses: [
              email
            ]
          },
          Message: { /* required */
            Body: { /* required */
              Html: {
                Data: htmlBody(reportName, url, status, invocationId)
              },
              Text: {
                Data: textBody(reportName, url, status, invocationId)
              }
            },
            Subject: { /* required */
              Data: `SeaSketch report ${status}: ${reportName}`,
            }
          },
          Source: 'do-not-reply@seasketch.org', /* required */
          ReplyToAddresses: [
            'do-not-reply@seasketch.org',
            /* more items */
          ],
        };
        await ses.sendEmail(params).promise();
        sent = true;
        await knex("emailSubscriptions").where({invocationId: invocationId}).del();  
      } catch(e) {
        if (!sent) {
          await knex('emailSubscriptions').update({locked: false}).where({invocationId: invocationId});
        }
      }
    }
} catch (e) {
    knex('emailSubscriptions').update({locked: false}).whereIn('invocationId', ids);
  }
}

module.exports = {
  sendEmails
}