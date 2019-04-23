const dayjs = require('dayjs');
const EventEmitter = require('events');
const ReconnectingWebSocket = require('reconnecting-websocket');
const WebSocket = require('ws');

class HDPoolWebsocketApi {
  constructor() {
    this.events = new EventEmitter();
    this.onOpen = () => this.publish('websocket/closed');
    this.onClose = () => this.publish('websocket/opened');
  }

  async init() {
    this.connecting = true;
    let connected = false;
    for (let endpointPos = 0; !connected; endpointPos = (endpointPos + 1) % this.websocketEndpoints.length ) {
      const websocketEndpoint = this.websocketEndpoints[endpointPos];
      this.publish('debug', `Connecting to ${websocketEndpoint} ..`);
      this.client = new ReconnectingWebSocket(websocketEndpoint, [], {
        WebSocket,
      });

      const isOpen = await new Promise(resolve => {
        let open = null;
        this.client.addEventListener('close', () => {
          if (open) {
            return;
          }
          open = false;
          resolve(open);
        }, {once: true});
        this.client.addEventListener('open', () => {
          if (open === false) {
            return;
          }
          open = true;
          resolve(open);
        }, {once: true});
      });

      if (!isOpen) {
        this.publish('debug', `Connecting to ${websocketEndpoint} failed, trying next endpoint`);
        this.client.close();
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        this.publish('debug', `Connection to ${websocketEndpoint} established`);
        this.publish('websocket/opened');
        connected = true;
      }
    }
    this.connecting = false;

    this.lastHeartbeat = dayjs();
    await this.sendHeartbeat();
    this.heartbeatInterval = setInterval(this.sendHeartbeat.bind(this), 5 * 1000);

    this.client.addEventListener('close', this.onClose);
    this.client.addEventListener('open', this.onOpen);

    this.updateConnectionAliveInterval = setInterval(this.updateConnectionAlive.bind(this), 5 * 1000);
  }

  async updateConnectionAlive() {
    if (this.connecting || this.lastHeartbeat.isAfter(dayjs().subtract(30, 'second'))) {
      return;
    }
    this.publish('debug', 'No heartbeats received in a while, reconnecting ..');
    this.publish('websocket/broken');
    await this.reconnect();
  }

  async reconnect() {
    this.destroy(false);
    await this.init();
  }

  async sendMessageAndAwaitResponse(request) {
    let handlerFunc = null;
    const result = await new Promise((resolve, reject) => {
      const expectResponse = (msg) => {
        msg = JSON.parse(msg.data);
        if (msg.cmd !== request.cmd) {
          return;
        }
        if (request.chk && request.chk.toString() !== msg.chk) {
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

  async sendHeartbeat() {
    this.lastHeartbeat = dayjs();
  }

  publish(topic, ...msg) {
    this.events.emit(topic, ...msg);
  }

  subscribe(topic, cb) {
    this.events.on(topic, cb);
  }

  destroy(complete = true) {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    if (this.updateConnectionAliveInterval) {
      clearInterval(this.updateConnectionAliveInterval);
      this.updateConnectionAliveInterval = null;
    }
    if (this.client) {
      this.client.removeEventListener('close', this.onClose);
      this.client.removeEventListener('open', this.onOpen);
      this.client.close();
      this.client = null;
    }
    if (complete) {
      this.events = null;
    }
  }
}

module.exports = HDPoolWebsocketApi;