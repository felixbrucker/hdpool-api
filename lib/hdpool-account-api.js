const dayjs = require('dayjs');
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
    userInfo.uext.update_ts = dayjs(`${userInfo.uext.update_ts}+0800`).toISOString();
    userInfo.uinfo.u_regist_time = dayjs(`${userInfo.uinfo.u_regist_time}+0800`).toISOString();
    userInfo.wallet.update_ts = dayjs(`${userInfo.wallet.update_ts}+0800`).toISOString();

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
      miner.update_ts = dayjs(`${miner.update_ts}+0800`).toISOString();
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
      expectedEarning.create_ts = dayjs(`${expectedEarning.create_ts}+0800`).toISOString();
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
      earning.create_ts = dayjs(`${earning.create_ts}+0800`).toISOString();
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
      withdraw.create_ts = dayjs(`${withdraw.create_ts}+0800`).toISOString();
      withdraw.update_ts = dayjs(`${withdraw.update_ts}+0800`).toISOString();
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
      deposit.create_ts = dayjs(`${deposit.create_ts}+0800`).toISOString();
      deposit.update_ts = dayjs(`${deposit.update_ts}+0800`).toISOString();
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
      plotter.create_ts = dayjs(`${plotter.create_ts}+0800`).toISOString();
      plotter.update_ts = dayjs(`${plotter.update_ts}+0800`).toISOString();
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
      rentingOrder.create_ts = dayjs(`${rentingOrder.create_ts}+0800`).toISOString();
      rentingOrder.update_ts = dayjs(`${rentingOrder.update_ts}+0800`).toISOString();
      rentingOrder.begin_ts = dayjs(`${rentingOrder.begin_ts}+0800`).toISOString();
      rentingOrder.end_ts = dayjs(`${rentingOrder.end_ts}+0800`).toISOString();
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
      lendingOrder.create_ts = dayjs(`${lendingOrder.create_ts}+0800`).toISOString();
      lendingOrder.update_ts = dayjs(`${lendingOrder.update_ts}+0800`).toISOString();
      lendingOrder.begin_ts = dayjs(`${lendingOrder.begin_ts}+0800`).toISOString();
      lendingOrder.end_ts = dayjs(`${lendingOrder.end_ts}+0800`).toISOString();
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
    if (withdrawHistory.length === 0) {
      return dayjs().subtract(1, 'minute').toDate();
    }

    const nonCanceledFreeWithdraws = withdrawHistory
      .filter(withdraw => withdraw.status !== 3)
      .filter(withdraw => withdraw.cashout_fee === 0);

    return dayjs(nonCanceledFreeWithdraws[0].create_ts).add(7, 'day').add(5, 'minute').toDate();
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
