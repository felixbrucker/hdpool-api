const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const HDPoolWebsocketApi = require('./hdpool-websocket-api');

dayjs.extend(utc);

class HDPoolAccountApi extends HDPoolWebsocketApi {
  static getNextBalanceUpdateDate() {
    const updateDate = dayjs().utc().hour(3).minute(0).second(0);

    return updateDate.isAfter(dayjs()) ? updateDate.toDate() : updateDate.add(1, 'day').toDate();
  }

  static getCurrentRoundEndDate() {
    const endDate = dayjs().utc().hour(16).minute(0).second(0);

    return endDate.isAfter(dayjs()) ? endDate.toDate() : endDate.add(1, 'day').toDate();
  }

  constructor(userId, sessionKey, pool = 'bhd_co') {
    super();
    if (!userId) {
      throw new Error('No uid supplied!');
    }
    if (!sessionKey) {
      throw new Error('No key supplied!');
    }

    this.uid = userId;
    this.key = sessionKey;
    this.pool = pool;
    switch (this.pool) {
      case 'bhd_co':
      case 'bhd_eco':
        this.coin = 'BHD';
        break;
    }

    this.websocketEndpoints = [
      `wss://hdpool.com/?uid=${this.uid}&key=${this.key}`,
      `wss://ali3.hdpool.com/?uid=${this.uid}&key=${this.key}`,
      `wss://ali4.hdpool.com/?uid=${this.uid}&key=${this.key}`,
    ];
  }

  async init() {
    await super.init();
    this.onBestMiningInfoRawBound = this.onBestMiningInfoRaw.bind(this);
    this.client.addEventListener('message', this.onBestMiningInfoRawBound);
    this.checkExpiredSessionBound = this.checkExpiredSession.bind(this);
    this.client.addEventListener('message', this.checkExpiredSessionBound);
  }

  checkExpiredSession(msg) {
    const data = JSON.parse(msg.data);
    if (!data.err) {
      return;
    }
    if (data.err.ret !== 'EFATAL') {
      return;
    }
    if (!data.err.msg.startsWith('uid not equ.')) {
      return;
    }

    this.publish('sessionExpired');
    this.destroy(true);
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

  async getUserInfo() {
    const userInfo = await this.sendMessageAndAwaitResponse({
      chk: new Date().getTime(),
      cmd: 'logind.get_uinfo',
      para: {
        uid: this.uid,
      },
    });

    // Use proper dates
    userInfo.uinfo.u_regist_time = dayjs(`${userInfo.uinfo.u_regist_time}+0800`).toISOString();

    return userInfo;
  }

  async getWalletInfo() {
    return this.sendMessageAndAwaitResponse({
      chk: new Date().getTime(),
      cmd: `fund.get_${this.coin.toLowerCase()}_wallet`,
      para: {
        uid: this.uid,
      },
    });
  }

  getEarningsStats() {
    return this.sendMessageAndAwaitResponse({
      chk: new Date().getTime(),
      cmd: 'apid.get_award_earnings',
      mark: this.pool,
      para: {
        uid: this.uid,
      },
    });
  }

  async getMiners() {
    const {data: miners } = await this.sendMessageAndAwaitResponse({
      chk: new Date().getTime(),
      cmd: 'apid.get_miner_list',
      mark: this.pool,
      para: {
        uid: this.uid,
      },
    });

    if (!miners) {
      return [];
    }

    miners.forEach(miner => {
      miner.last_ts = dayjs.unix(miner.last_ts).toISOString();
    });

    return miners;
  }

  async getExpectedEarningsHistory(offset = 0, count = 200) {
    const { data: expectedEarningsHistory } =  await this.sendMessageAndAwaitResponse({
      chk: new Date().getTime(),
      cmd: 'apid.get_award_block_list',
      mark: this.pool,
      para: {
        uid: this.uid,
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
      cmd: 'apid.get_award_daily_list',
      mark: this.pool,
      para: {
        uid: this.uid,
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
      cmd: 'fund.get_cashout_list',
      para: {
        uid: this.uid,
        coin: this.coin,
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
      cmd: 'fund.get_deposit_list',
      para: {
        uid: this.uid,
        coin: this.coin,
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
      mark: this.pool,
      para: {
        uid: this.uid,
      },
    });
  }

  async getBoundPlotter(offset = 0, count = 10) {
    const { data: boundPlotter } =  await this.sendMessageAndAwaitResponse({
      chk: new Date().getTime(),
      mark: this.pool,
      cmd: 'apid.get_bind_plotter_status',
      para: {
        uid: this.uid,
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

  async withdraw(amount, emailCode = null, authCode = null) {
    if (!amount) {
      throw new Error('No amount supplied!');
    }
    if (!emailCode && !authCode) {
      throw new Error('No emailCode or authCode supplied!');
    }

    const para = {
      uid: this.uid,
      amount,
    };
    if (authCode) {
      para.auth_code = authCode;
    }
    if (emailCode) {
      para.email_code = emailCode;
    }

    await this.sendMessageAndAwaitResponse({
      chk: new Date().getTime(),
      cmd: `fund.set_${this.coin.toLowerCase()}_cashout`,
      para,
    });
  }

  async changeWithdrawAddress(address, emailCode = null, authCode = null) {
    if (!address) {
      throw new Error('No address supplied!');
    }
    if (!emailCode && !authCode) {
      throw new Error('No emailCode or authCode supplied!');
    }

    const para = {
      uid: this.uid,
    };
    para[`${this.coin.toLowerCase()}_addr`] = address;
    if (authCode) {
      para.auth_code = authCode;
    }
    if (emailCode) {
      para.email_code = emailCode;
    }

    await this.sendMessageAndAwaitResponse({
      chk: new Date().getTime(),
      cmd: `fund.reset_${this.coin.toLowerCase()}_cashout_addr`,
      para,
    });
  }

  async getDepositAddr() {
    const data = this.sendMessageAndAwaitResponse({
      chk: new Date().getTime(),
      cmd: `fund.get_deposit_${this.coin.toLowerCase()}_addr`,
      para: {
        uid: this.uid,
      },
    });

    return data[`${this.coin.toLowerCase()}_addr`];
  }

  async getNextFreePaymentDate() {
    const withdrawHistory = await this.getWithdrawHistory();

    const nonCanceledFreeWithdraws = withdrawHistory
      .filter(withdraw => withdraw.status !== 3)
      .filter(withdraw => withdraw.cashout_fee === 0);

    if (nonCanceledFreeWithdraws.length === 0) {
      return dayjs().subtract(1, 'minute').toDate();
    }

    return dayjs(nonCanceledFreeWithdraws[0].create_ts).add(7, 'day').add(5, 'minute').toDate();
  }

  async cancelWithdraw(cashoutId) { // TODO
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

  async sendEmailCode() {
    const userInfo = await this.getUserInfo();

    await this.sendMessageAndAwaitResponse({
      chk: new Date().getTime(),
      cmd: 'logind.send_emailcode',
      para: {
        email: userInfo.uinfo.bind_email,
      },
    });
  }

  onBestMiningInfo(cb) {
    this.subscribe('bestMiningInfo', cb);
  }

  destroy(complete = true) {
    if (this.client) {
      this.client.removeEventListener('message', this.onBestMiningInfoRawBound);
      this.client.removeEventListener('message', this.checkExpiredSessionBound);
    }
    super.destroy(complete);
  }
}

module.exports = HDPoolAccountApi;
