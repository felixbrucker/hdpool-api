const HDPoolWebsocketApi = require('./hdpool-websocket-api');

class HDPoolMiningApi extends HDPoolWebsocketApi {
  constructor(accountKey, minerName, capacityInGB, useEcoPool = false) {
    super();
    if (!accountKey) {
      throw new Error('No accountKey supplied!');
    }
    if (!minerName) {
      throw new Error('No minerName supplied!');
    }
    if (!capacityInGB) {
      throw new Error('No capacity supplied!');
    }

    this.websocketEndpoints = useEcoPool ? [
      'wss://ecominer.hdpool.com',
    ] : [
      'wss://hdminer.hdpool.com',
      'wss://ali3miner.hdpool.com',
      'wss://ali4miner.hdpool.com',
    ];
    this.hdproxyVersion = '20190423';
    this.accountKey = accountKey;
    this.minerName = minerName;
    this.capacity = capacityInGB;
  }

  async init() {
    await super.init();
    this.onMiningInfoRaw = (msg) => {
      const data = JSON.parse(msg.data);
      if (data.cmd !== 'poolmgr.mining_info') {
        return;
      }

      this.publish('miningInfo', data.para);
    };
    this.client.addEventListener('message', this.onMiningInfoRaw);
  }

  async sendHeartbeat() {
    await this.sendMessageAndAwaitResponse({
      cmd: 'poolmgr.heartbeat',
      para: {
        account_key: this.accountKey,
        miner_name: this.minerName,
        miner_mark: `${this.minerName}.hdproxy.exe.${this.hdproxyVersion}`,
        capacity: this.capacity,
      },
    });
    await super.sendHeartbeat();
  }

  getMiningInfo() {
    return this.sendMessageAndAwaitResponse({
      cmd: 'mining_info',
      para: {},
    });
  }

  submitNonce(accountId, height, nonce, deadline) {
    if (!accountId) {
      throw new Error('No accountId supplied!');
    }
    if (!height) {
      throw new Error('No height supplied!');
    }
    if (!nonce) {
      throw new Error('No nonce supplied!');
    }
    if (!deadline) {
      throw new Error('No deadline supplied!');
    }

    // HDPool does not respond with a result, so just fire away
    this.client.send(JSON.stringify(({
      cmd: 'poolmgr.submit_nonce',
      para: {
        account_key: this.accountKey,
        capacity: this.capacity,
        miner_mark: '',
        miner_name: this.minerName,
        submit: [{
          accountId,
          height,
          nonce,
          deadline,
          ts: (new Date()).getTime() / 1000,
        }],
      },
    })));
  }

  onMiningInfo(cb) {
    this.subscribe('miningInfo', cb);
  }

  destroy(complete = true) {
    if (this.client) {
      this.client.removeEventListener('message', this.onMiningInfoRaw);
    }
    super.destroy(complete);
  }
}

module.exports = HDPoolMiningApi;
