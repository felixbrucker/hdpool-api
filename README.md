HDPool API
======

[![Software License](https://img.shields.io/badge/license-GPL--3.0-brightgreen.svg?style=flat-square)](LICENSE)
[![npm](https://img.shields.io/npm/v/hdpool-api.svg?style=flat-square)](https://www.npmjs.com/package/hdpool-api)
[![npm weekly downloads](https://img.shields.io/npm/dw/hdpool-api.svg?style=flat-square)](https://www.npmjs.com/package/hdpool-api)

## Usage

### Public API
```javascript
const { HDPoolPublicApi } = require('hdpool-api');

const client = new HDPoolPublicApi();

(async () => {
  await client.init();

  const poolStats = await client.getPoolStats();

  const loginCodeResponse = await client.getLoginCode(); // Retrieve login code png

  const loginResponse = await client.login('example@mail.tld', 'mypassword', '123456');

  client.onBestMiningInfo(bestMiningInfo => {
      // Do stuff
    });
})();
```

### Account API
```javascript
const { HDPoolAccountApi } = require('hdpool-api');

const userId = 12345;
const sessionKey = 'rOw7vZuqaC0GbapWGxeUECwLfDJaE2J74aCrmgnRfroolPuMOZUX7GotMRsy';

const client = new HDPoolAccountApi(userId, sessionKey);

(async () => {
  await client.init();

  const userInfo = await client.getUserInfo();
  const earningsStats = await client.getEarningsStats();
  const miners = await client.getMiners();
  const pledgeState = await client.getPledgeState();
  const boundPlotter = await client.getBoundPlotter();
  const depositHistory = await client.getDepositHistory();
  const withdrawHistory = await client.getWithdrawHistory();
  const earningsHistory = await client.getEarningsHistory();
  const expectedEarningsHistory = await client.getExpectedEarningsHistory();
  const poolStats = await client.getPoolStats();
  const nextFreePaymentDate = await client.getNextFreePaymentDate(); // When we can send a payout without paying fees
  
  await client.withdraw(Math.round(5 * Math.pow(10, 8)), 'some code'); // withdraw 5 BHD
  await client.cancelWithdraw(1234); // Cancel the withdraw with id 1234
  const depositAddr= await client.getDepositAddr(); // retrieve your deposit addr
  
  client.onBestMiningInfo(bestMiningInfo => {
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

const client = new HDPoolMiningApi(accountKey, minerName, capacityInGB);

(async () => {
  await client.init();

  const miningInfo = await client.getMiningInfo();

  client.onMiningInfo(miningInfo => {
    // Do stuff
  });

  client.submitNonce('12297078971021390907', 143779, '111137519053', 81);
})();
```

## Obtaining the userId and sessionKey

- Login to hdpool
- Open the dev console (F12) and enter `localStorage.getItem('sess')` into the console
- Copy the uid (userId) and key (sessionKey) values

## License

GNU GPLv3 (see [LICENSE](https://github.com/felixbrucker/hdpool-api/blob/master/LICENSE))
