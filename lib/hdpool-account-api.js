const HDPoolWebsocketApi = require('./hdpool-websocket-api');

class HDPoolAccountApi extends HDPoolWebsocketApi {
  constructor(userId, sessionKey) {
    super();
    if (!userId) {
      throw new Error('No uid supplied!');
    }
    if (!sessionKey) {
      throw new Error('No key supplied!');
    }

    this.baseUrl = 'wss://hdpool.com';
    this.uid = userId;
    this.key = sessionKey;

    this.websocketEndpoint = `${this.baseUrl}/?uid=${this.uid}&key=${this.key}`;
  }

  async init() {
    await super.init();
    this.client.addEventListener('message', (msg) => {
      const data = JSON.parse(msg.data);
      if (data.cmd !== 'apid.best_mining_info') {
        return;
      }

      this.publish('bestMiningInfo', data.para);
    });
  }

  async sendHeartbeat() {
    await this.sendMessageAndAwaitResponse({
      cmd: 'online.heartbeat',
    });
  }

  getPoolStats() {
    return this.sendMessageAndAwaitResponse({
      chk: new Date().getTime(),
      cmd: 'apid.get_pool_stat',
      para: {
        type: 'bhd',
      },
    });
  }

  getUserInfo() {
    return this.sendMessageAndAwaitResponse({
      chk: new Date().getTime(),
      cmd: 'logind.get_uinfo',
      para: {
        uid: this.uid,
      },
    });
  }

  getGeneralStats() {
    return this.sendMessageAndAwaitResponse({
      chk: new Date().getTime(),
      cmd: 'apid.get_index_data',
      para: {
        uid: this.uid,
        type: 'bhd',
      },
    });
  }

  async getMiners() {
    const {data: miners } = await this.sendMessageAndAwaitResponse({
      chk: new Date().getTime(),
      cmd: 'apid.get_mill_list',
      para: {
        uid: this.uid,
        type: 'bhd',
      },
    });

    return miners;
  }

  getExpectedEarningsHistory(offset = 0, count = 200) {
    return this.sendMessageAndAwaitResponse({
      chk: new Date().getTime(),
      cmd: 'apid.get_expected_profit',
      para: {
        uid: this.uid,
        type: 'bhd',
        offset,
        count,
      },
    });
  }

  getEarningsHistory(offset = 0, count = 10) {
    return this.sendMessageAndAwaitResponse({
      chk: new Date().getTime(),
      cmd: 'apid.get_award_list',
      para: {
        uid: this.uid,
        type: 'bhd',
        offset,
        count,
      },
    });
  }

  getWithdrawHistory(offset = 0, count = 10) {
    return this.sendMessageAndAwaitResponse({
      chk: new Date().getTime(),
      cmd: 'apid.get_ransom_state',
      para: {
        uid: this.uid,
        type: 'bhd',
        offset,
        count,
      },
    });
  }

  getDepositHistory(offset = 0, count = 10) {
    return this.sendMessageAndAwaitResponse({
      chk: new Date().getTime(),
      cmd: 'apid.get_pledge_apply_state',
      para: {
        uid: this.uid,
        type: 'bhd',
        offset,
        count,
      },
    });
  }

  getPledgeState() {
    return this.sendMessageAndAwaitResponse({
      chk: new Date().getTime(),
      cmd: 'apid.get_pledge_state',
      para: {
        uid: this.uid,
        type: 'bhd',
      },
    });
  }

  getBoundPlotter(offset = 0, count = 10) {
    return this.sendMessageAndAwaitResponse({
      chk: new Date().getTime(),
      cmd: 'apid.get_bind_plotter_status',
      para: {
        uid: this.uid,
        type: 'bhd',
        offset,
        count,
      },
    });
  }

  getRentalDetails(days = 7) {
    return this.sendMessageAndAwaitResponse({
      chk: new Date().getTime(),
      cmd: 'apid.get_rental_detail',
      para: {
        uid: this.uid,
        type: 'bhd',
        days,
      },
    });
  }

  getRentingState() {
    return this.sendMessageAndAwaitResponse({
      chk: new Date().getTime(),
      cmd: 'apid.get_rentin_state',
      para: {
        uid: this.uid,
        type: 'bhd',
      },
    });
  }

  async getRentingOrderHistory(offset = 0, count = 10) {
    return this.sendMessageAndAwaitResponse({
      chk: new Date().getTime(),
      cmd: 'apid.get_rentin_order_list',
      para: {
        uid: this.uid,
        type: 'bhd',
        offset,
        count,
      },
    });
  }

  // Not sure exactly what the amount is for
  getLendingEarningsStats(amount = 100000000) {
    return this.sendMessageAndAwaitResponse({
      chk: new Date().getTime(),
      cmd: 'apid.get_rentout_earning',
      para: {
        uid: this.uid,
        type: 'bhd',
        amount,
      },
    });
  }

  getLendingOrderHistory(offset = 0, count = 10) {
    return this.sendMessageAndAwaitResponse({
      chk: new Date().getTime(),
      cmd: 'apid.get_rentout_order_list',
      para: {
        uid: this.uid,
        type: 'bhd',
        offset,
        count,
      },
    });
  }

  async rent(amount, days) {
    if (!amount) {
      throw new Error('No amount supplied!');
    }
    if (!days) {
      throw new Error('No days supplied!');
    }

    await this.sendMessageAndAwaitResponse({
      chk: new Date().getTime(),
      cmd: 'apid.rentin_apply',
      para: {
        uid: this.uid,
        type: 'bhd',
        amount,
        days,
      },
    });
  }

  async lend(amount, days) {
    if (!amount) {
      throw new Error('No amount supplied!');
    }
    if (!days) {
      throw new Error('No days supplied!');
    }

    await this.sendMessageAndAwaitResponse({
      chk: new Date().getTime(),
      cmd: 'apid.rentout_apply',
      para: {
        uid: this.uid,
        type: 'bhd',
        amount,
        days,
      },
    });
  }

  async withdraw(amount) {
    if (!amount) {
      throw new Error('No amount supplied!');
    }

    await this.sendMessageAndAwaitResponse({
      chk: new Date().getTime(),
      cmd: 'apid.ransom_apply',
      para: {
        uid: this.uid,
        type: 'bhd',
        amount,
      },
    });
  }

  async deposit(amount) {
    if (!amount) {
      throw new Error('No amount supplied!');
    }

    return this.sendMessageAndAwaitResponse({
      chk: new Date().getTime(),
      cmd: 'apid.pledge_apply',
      para: {
        uid: this.uid,
        type: 'bhd',
        amount,
      },
    });
  }

  onBestMiningInfo(cb) {
    this.subscribe('bestMiningInfo', cb);
  }

}

module.exports = HDPoolAccountApi;
