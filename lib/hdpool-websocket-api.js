const EventEmitter = require('events');
const ReconnectingWebSocket = require('reconnecting-websocket');
const WebSocket = require('ws');

class HDPoolWebsocketApi {
  async init() {
    this.events = new EventEmitter();
    this.client = new ReconnectingWebSocket(this.websocketEndpoint, [], {
      WebSocket,
    });

    await new Promise(resolve => {
      this.client.addEventListener('open', resolve, {once: true});
    });

    await this.sendHeartbeat();
    this.heartbeatInterval = setInterval(this.sendHeartbeat.bind(this), 5 * 1000);
  }

  async sendMessageAndAwaitResponse(request) {
    let handlerFunc = null;
    const result = await new Promise((resolve, reject) => {
      const expectResponse = (msg) => {
        msg = JSON.parse(msg.data);
        if (msg.cmd !== request.cmd) {
          return;
        }
        if (msg.err) {
          return reject(new Error(msg.err.msg));
        }
        resolve(msg.para);
      };
      handlerFunc = expectResponse;
      this.client.addEventListener('message', expectResponse);

      this.client.send(JSON.stringify(request));
    });
    this.client.removeEventListener('message', handlerFunc);
    handlerFunc = null;

    return result;
  }

  async sendHeartbeat() {}

  publish(topic, ...msg) {
    this.events.emit(topic, ...msg);
  }

  subscribe(topic, cb) {
    this.events.on(topic, cb);
  }

  destroy() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    if (this.client) {
      this.client.close();
      this.client = null;
    }
    this.events = null;
  }
}

module.exports = HDPoolWebsocketApi;