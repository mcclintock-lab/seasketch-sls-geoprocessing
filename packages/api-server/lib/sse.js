const TIMEOUT = 5 * 60 * 1000; // 5 minutes
const getStatus = require("./getStatus");
const { Client } = require("pg");
const client = new Client(process.env.DB_CONNECTION_STRING);
client.connect();
const debug = require("./debug");
client.query("LISTEN invocation_log");
client.query("LISTEN invocation_status_updated");
const camelcase = require("camelcase");
const EventEmitter = require("events");
const REPORTING_EVENT_TYPE_LOG_EVENT = 'REPORTING_EVENT_TYPE_LOG_EVENT';
const REPORTING_EVENT_TYPE_STATUS_UPDATE = 'REPORTING_EVENT_TYPE_STATUS_UPDATE';
const asInvocation = require('./asInvocation');
const knex = require('./knex');

const notifyEmitter = new EventEmitter();
client.on("notification", (msg) => {
  notifyEmitter.emit("notify", {
    channel: msg.channel,
    payload: JSON.parse(msg.payload)
  });
});


class SSEventEmitter {
  constructor(project, func, invocationId, req, res) {
    debug(`Creating new SSEventEmitter ${invocationId}`);
    this.statusArgs = [project, func, invocationId];
    this.invocationId = invocationId;
    this.requestId = invocationId;
    this.res = res;
    req.socket.setTimeout(TIMEOUT);
    this.res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive"
    });
    this.res.write("\n");
    this.sendStatus();
    this.onNotification = this.onNotification.bind(this);
    this.res.on("close", this.onClose.bind(this));
    notifyEmitter.on("notify", this.onNotification);
  }

  onClose() {
    notifyEmitter.removeListener('notify', this.onNotification);
    debug(`Closed SSEventEmitter for ${this.invocationId}`);
  }

  // Send the full status of an invocation when the connection is first opened
  async sendStatus(data) {
    if (!data) {
      data = await getStatus(this.invocationId);
    }
    const event = {
      eventType: REPORTING_EVENT_TYPE_STATUS_UPDATE,
      payload: data
    }
    debug(`Sending ${REPORTING_EVENT_TYPE_STATUS_UPDATE} for ${event.payload.uuid}`);
    if (data.closed) {
      debug(`CLOSED ${data.uuid}`);
      this.res.end(`data: ${JSON.stringify(event)}\n\n`);
      this.onClose();
    } else {
      this.res.write(`data: ${JSON.stringify(event)}\n\n`);
      if (event.payload.requestId && event.payload.requestId !== this.requestId) {
        this.requestId = event.payload.requestId;
        // There may be logs assigned to that requestId that haven't been sent yet. Send them
        // This may mean that logs are sent twice and clients will have to deal with that 
        const logs = await knex('logs').where('requestId', this.requestId);
        logs.forEach((log) => {
          this.res.write(`data: ${JSON.stringify({
            eventType: REPORTING_EVENT_TYPE_LOG_EVENT,
            payload: log
          })}\n\n`);
        });
      }
    }
  }

  onNotification(msg) {
    if (msg.channel === 'invocation_status_updated') {
      if (msg.payload.uuid !== this.invocationId) {
        return;
      }
      const status = msg.payload;
      this.sendStatus(asInvocation(Object.keys(status).reduce((obj, key) => {
        obj[camelcase(key)] = status[key]
        return obj;
      }, {})));
    } else if (msg.channel === 'invocation_log') {
      if (msg.payload.request_id === this.invocationId || msg.payload.request_id === this.requestId) {
        const event = {
          eventType: REPORTING_EVENT_TYPE_LOG_EVENT,
          payload: Object.keys(msg.payload).reduce((obj, key) => {
            obj[camelcase(key)] = msg.payload[key]
            return obj;
          }, {})
        }
        this.res.write(`data: ${JSON.stringify(event)}\n\n`);
      }
    }
  }
}

module.exports = SSEventEmitter;
