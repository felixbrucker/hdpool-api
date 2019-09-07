const HDPoolWebsocketApi = require('./hdpool-websocket-api');

class HDPoolMiningApi extends HDPoolWebsocketApi {
  constructor(accountKey, minerName, capacityInGB, useEcoPool = false, coin = 'BHD') {
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
      'wss://miner.hdpool.com',
    ];
    this.coin = coin;
    this.hdproxyVersion = '20190908';
    this.accountKey = accountKey;
    this.minerName = minerName;
    this.capacity = capacityInGB;
    this.lastHeight = null;
  }

  async init() {
    await super.init();
    const miningInfo = await this.getMiningInfo();
    this.lastHeight = miningInfo.height;
    this.onMiningInfoRaw = (msg) => {
      const data = JSON.parse(msg.data);
      if (data.cmd !== 'poolmgr.mining_info') {
        return;
      }
      // Ignore miningInfo for other coins
      if (this.lastHeight && Math.abs(data.para.height - this.lastHeight) > 200) {
        return;
      }
      this.lastHeight = data.para.height;

      this.publish('miningInfo', data.para);
    };
    this.client.addEventListener('message', this.onMiningInfoRaw);
  }

  async sendHeartbeat() {
    await this.sendMessageAndAwaitResponse({
      cmd: 'poolmgr.heartbeat',
      mark: this.coin,
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
      mark: this.coin,
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
    if (nonce === undefined || nonce === null) {
      throw new Error('No nonce supplied!');
    }
    if (deadline === undefined || deadline === null) {
      throw new Error('No deadline supplied!');
    }

    // HDPool does not respond with a result, so just fire away
    this.client.send(JSON.stringify(({
      cmd: 'poolmgr.submit_nonce',
      mark: this.coin,
      para: {
        account_key: this.accountKey,
        capacity: this.capacity,
        miner_mark: '',
        miner_name: this.minerName,
        submit: [{
          accountId,
          coin: this.coin,
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
