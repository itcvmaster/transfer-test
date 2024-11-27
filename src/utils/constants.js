const bitcoin = require('bitcoinjs-lib');

export const BTC_NETWORK = bitcoin.networks.bitcoin; // Use bitcoin.networks.testnet for testnet
export const UTXO_API = (address) => `https://blockstream.info/api/address/${address}/utxo`;