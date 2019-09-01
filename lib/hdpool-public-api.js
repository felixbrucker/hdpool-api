const crypto = require('crypto');
const HDPoolWebsocketApi = require('./hdpool-websocket-api');


class HDPoolPublicApi extends HDPoolWebsocketApi {
  constructor(pool = 'bhd_co') {
    super();

    this.pool = pool;

    this.websocketEndpoints = [
      'wss://hdpool.com',
      'wss://ali3.hdpool.com',
      'wss://ali4.hdpool.com',
    ];
  }

  async init() {
    await super.init();
    this.onBestMiningInfoRawBound = this.onBestMiningInfoRaw.bind(this);
    this.client.addEventListener('message', this.onBestMiningInfoRawBound);
  }

  onBestMiningInfoRaw(msg) {
    const data = JSON.parse(msg.data);
    if (data.cmd !== 'apid.best_mining_info') {
      return;
    }

    this.publish('bestMiningInfo', data.para);
  }

  async sendHeartbeat() {
    await this.sendMessageAndAwaitResponse({
      cmd: 'online.heartbeat',
    });
    await super.sendHeartbeat();
  }

  getPoolStats() {
    return this.sendMessageAndAwaitResponse({
      chk: new Date().getTime(),
      cmd: 'apid.get_pool_stat',
      mark: this.pool,
      para: {},
    });
  }

  async getLoginCode() {
    const res = await this.sendMessageAndAwaitResponse({
      chk: new Date().getTime(),
      cmd: 'logind.new_code',
    });

    const img = res.b64png !== '' ? res.b64png : res.b58png;
    const encoding = res.b64png !== '' ? 'base64' : 'base58';
    res.imgBuffer = Buffer.from(img, encoding);

    return res;
  }

  async login(email, password, code) {
    return this.sendMessageAndAwaitResponse({
      chk: new Date().getTime(),
      cmd: 'logind.login',
      para: {
        email,
        passwd: crypto.createHash('md5').update(password).digest('hex'),
        imgcode: code,
      },
    });
  }

  onBestMiningInfo(cb) {
    this.subscribe('bestMiningInfo', cb);
  }

  destroy(complete = true) {
    if (this.client) {
      this.client.removeEventListener('message', this.onBestMiningInfoRawBound);
    }
    super.destroy(complete);
  }
}

module.exports = HDPoolPublicApi;
