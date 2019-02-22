HDPool API
======

[![Software License](https://img.shields.io/badge/license-GPL--3.0-brightgreen.svg?style=flat-square)](LICENSE)
[![npm](https://img.shields.io/npm/v/hdpool-api.svg?style=flat-square)](https://www.npmjs.com/package/hdpool-api)

## Usage

### Account API
```javascript
const { HDPoolAccountApi } = require('hdpool-api');

const userId = 12345;
const sessionKey = 'rOw7vZuqaC0GbapWGxeUECwLfDJaE2J74aCrmgnRfroolPuMOZUX7GotMRsy';

const hdpoolAccountApi = new HDPoolAccountApi(userId, sessionKey);

(async () => {
  await hdpoolAccountApi.init();

  const userInfo = await hdpoolAccountApi.getUserInfo();
  const generalStats = await hdpoolAccountApi.getGeneralStats();
  const miners = await hdpoolAccountApi.getMiners();
  const pledgeState = await hdpoolAccountApi.getPledgeState();
  const boundPlotter = await hdpoolAccountApi.getBoundPlotter();
  const depositHistory = await hdpoolAccountApi.getDepositHistory();
  const withdrawHistory = await hdpoolAccountApi.getWithdrawHistory();
  const earningsHistory = await hdpoolAccountApi.getEarningsHistory();
  const expectedEarningsHistory = await hdpoolAccountApi.getExpectedEarningsHistory();
  const rentalDetails = await hdpoolAccountApi.getRentalDetails();
  const rentingState = await hdpoolAccountApi.getRentingState();
  const rentingOrderHistory = await hdpoolAccountApi.getRentingOrderHistory();
  const lendingEarningsStats = await hdpoolAccountApi.getLendingEarningsStats();
  const lendingOrderHistory = await hdpoolAccountApi.getLendingOrderHistory();
  
  await hdpoolAccountApi.rent(Math.round(2 * Math.pow(10, 8)), 7);  // rent 2 BHD for 7 days
  await hdpoolAccountApi.lend(Math.round(5 * Math.pow(10, 8)), 15); // lend 5 BHD for 15 days
  await hdpoolAccountApi.withdraw(Math.round(5 * Math.pow(10, 8))); // withdraw 5 BHD
  const {
    pool_wallet_addr,
    trans_amount,
  } = await hdpoolAccountApi.deposit(Math.round(5 * Math.pow(10, 8))); // deposit 5 BHD, actual amount to send might differ
  
  hdpoolAccountApi.onBestMiningInfo(bestMiningInfo => {
    // Do stuff
  });
})();
```

### Mining API
```javascript
const { HDPoolMiningApi } = require('hdpool-api');

const accountKey = 'dpvwfv34-xprf-15t2xwb12o8yglm4palf55';
const minerName = 'Miner 1';
const capacityInGB = 512;

const hdpoolMiningApi = new HDPoolMiningApi(accountKey, minerName, capacityInGB);

(async () => {
  await hdpoolMiningApi.init();

  const miningInfo = await hdpoolMiningApi.getMiningInfo();

  hdpoolMiningApi.onMiningInfo(miningInfo => {
    // Do stuff
  });

  hdpoolMiningApi.submitNonce('12297078971021390907', 143779, '111137519053', 81);
})();
```

## Obtaining the userId and sessionKey

- Login to hdpool
- Open the dev console (F12) and enter `localStorage.getItem('sess')` into the console
- Copy the uid (userId) and key (sessionKey) values

## License

GNU GPLv3 (see [LICENSE](https://github.com/felixbrucker/hdpool-api/blob/master/LICENSE))
