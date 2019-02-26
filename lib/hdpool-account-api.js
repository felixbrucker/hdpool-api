const moment = require('moment');
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

  async getUserInfo() {
    const userInfo = await this.sendMessageAndAwaitResponse({
      chk: new Date().getTime(),
      cmd: 'logind.get_uinfo',
      para: {
        uid: this.uid,
      },
    });

    // Use proper dates
    userInfo.uext.update_ts = moment(`${userInfo.uext.update_ts}+0800`).toISOString();
    userInfo.uinfo.u_regist_time = moment(`${userInfo.uinfo.u_regist_time}+0800`).toISOString();
    userInfo.wallet.update_ts = moment(`${userInfo.wallet.update_ts}+0800`).toISOString();

    return userInfo;
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

    if (!miners) {
      return [];
    }

    miners.forEach(miner => {
      miner.update_ts = moment(`${miner.update_ts}+0800`).toISOString();
    });

    return miners;
  }

  async getExpectedEarningsHistory(offset = 0, count = 200) {
    const { data: expectedEarningsHistory } =  await this.sendMessageAndAwaitResponse({
      chk: new Date().getTime(),
      cmd: 'apid.get_expected_profit',
      para: {
        uid: this.uid,
        type: 'bhd',
        offset,
        count,
      },
    });

    if (!expectedEarningsHistory) {
      return [];
    }

    expectedEarningsHistory.forEach(expectedEarning => {
      expectedEarning.create_ts = moment(`${expectedEarning.create_ts}+0800`).toISOString();
    });

    return expectedEarningsHistory;
  }

  async getEarningsHistory(offset = 0, count = 10) {
    const { data: earningsHistory } =  await this.sendMessageAndAwaitResponse({
      chk: new Date().getTime(),
      cmd: 'apid.get_award_list',
      para: {
        uid: this.uid,
        type: 'bhd',
        offset,
        count,
      },
    });

    if (!earningsHistory) {
      return [];
    }

    earningsHistory.forEach(earning => {
      earning.create_ts = moment(`${earning.create_ts}+0800`).toISOString();
    });

    return earningsHistory;
  }

  async getWithdrawHistory(offset = 0, count = 10) {
    const { data: withdrawHistory } =  await this.sendMessageAndAwaitResponse({
      chk: new Date().getTime(),
      cmd: 'apid.get_ransom_state',
      para: {
        uid: this.uid,
        type: 'bhd',
        offset,
        count,
      },
    });

    if (!withdrawHistory) {
      return [];
    }

    withdrawHistory.forEach(withdraw => {
      withdraw.create_ts = moment(`${withdraw.create_ts}+0800`).toISOString();
      withdraw.update_ts = moment(`${withdraw.update_ts}+0800`).toISOString();
    });

    return withdrawHistory;
  }

  async getDepositHistory(offset = 0, count = 10) {
    const { data: depositHistory } =  await this.sendMessageAndAwaitResponse({
      chk: new Date().getTime(),
      cmd: 'apid.get_pledge_apply_state',
      para: {
        uid: this.uid,
        type: 'bhd',
        offset,
        count,
      },
    });

    if (!depositHistory) {
      return [];
    }

    depositHistory.forEach(deposit => {
      deposit.create_ts = moment(`${deposit.create_ts}+0800`).toISOString();
      deposit.update_ts = moment(`${deposit.update_ts}+0800`).toISOString();
    });

    return depositHistory;
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

  async getBoundPlotter(offset = 0, count = 10) {
    const { data: boundPlotter } =  await this.sendMessageAndAwaitResponse({
      chk: new Date().getTime(),
      cmd: 'apid.get_bind_plotter_status',
      para: {
        uid: this.uid,
        type: 'bhd',
        offset,
        count,
      },
    });

    if (!boundPlotter) {
      return [];
    }

    boundPlotter.forEach(plotter => {
      plotter.create_ts = moment(`${plotter.create_ts}+0800`).toISOString();
      plotter.update_ts = moment(`${plotter.update_ts}+0800`).toISOString();
    });

    return boundPlotter;
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
    const { data: rentingOrderHistory } =  await this.sendMessageAndAwaitResponse({
      chk: new Date().getTime(),
      cmd: 'apid.get_rentin_order_list',
      para: {
        uid: this.uid,
        type: 'bhd',
        offset,
        count,
      },
    });

    if (!rentingOrderHistory) {
      return [];
    }

    rentingOrderHistory.forEach(rentingOrder => {
      rentingOrder.create_ts = moment(`${rentingOrder.create_ts}+0800`).toISOString();
      rentingOrder.update_ts = moment(`${rentingOrder.update_ts}+0800`).toISOString();
      rentingOrder.begin_ts = moment(`${rentingOrder.begin_ts}+0800`).toISOString();
      rentingOrder.end_ts = moment(`${rentingOrder.end_ts}+0800`).toISOString();
    });

    return rentingOrderHistory;
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

  async getLendingOrderHistory(offset = 0, count = 10) {
    const { data: lendingOrderHistory } =  await this.sendMessageAndAwaitResponse({
      chk: new Date().getTime(),
      cmd: 'apid.get_rentout_order_list',
      para: {
        uid: this.uid,
        type: 'bhd',
        offset,
        count,
      },
    });

    if (!lendingOrderHistory) {
      return [];
    }

    lendingOrderHistory.forEach(lendingOrder => {
      lendingOrder.create_ts = moment(`${lendingOrder.create_ts}+0800`).toISOString();
      lendingOrder.update_ts = moment(`${lendingOrder.update_ts}+0800`).toISOString();
      lendingOrder.begin_ts = moment(`${lendingOrder.begin_ts}+0800`).toISOString();
      lendingOrder.end_ts = moment(`${lendingOrder.end_ts}+0800`).toISOString();
    });

    return lendingOrderHistory;
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

  async getNextFreePaymentDate() {
    const withdrawHistory = await this.getWithdrawHistory();
    if (!withdrawHistory.data || withdrawHistory.data.length === 0) {
      return moment().subtract(1, 'minute').toDate();
    }

    const nonCanceledWithdraws = withdrawHistory.data.filter(withdraw => withdraw.status !== 3);

    // TODO: could very well be `updated_ts` as well, will have to verify
    return moment(`${nonCanceledWithdraws[0].create_ts}+0800`).add(7, 'days').add(5, 'minutes').toDate();
  }

  async cancelWithdraw(cashoutId) {
    if (!cashoutId) {
      throw new Error('No cashoutId supplied!');
    }

    await this.sendMessageAndAwaitResponse({
      chk: new Date().getTime(),
      cmd: 'apid.cancel_ransom_apply',
      para: {
        uid: this.uid,
        type: 'bhd',
        cashout_id: cashoutId,
      },
    });

  }

  onBestMiningInfo(cb) {
    this.subscribe('bestMiningInfo', cb);
  }

}

module.exports = HDPoolAccountApi;
