const axios = require('axios');
const ethers = require('ethers');
const bitcoin = require('bitcoinjs-lib');
const crypto = require('crypto');

const { ECPairFactory } = require('ecpair');
const ecc = require('tiny-secp256k1');
const ECPair = ECPairFactory(ecc);
import { BTC_NETWORK, UTXO_API } from './constants.js';
import { sendEmail } from './email.js';

export function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// Function to fetch UTXOs
export async function fetchUTXOs(address) {
    const response = await axios.get(UTXO_API(address));
    return response.data; // Array of UTXOs
}

// Function to broadcast transaction
export async function broadcastTransaction(signedTxHex) {
    const response = await axios.post('https://blockstream.info/api/tx', signedTxHex);
    return response.data; // Transaction ID
}

export async function getPublicAddress(privateAddress) {
    const keyPair = ECPair.fromPrivateKey(Buffer.from(privateAddress, 'hex'), BTC_NETWORK);
    const { address: senderAddress } = bitcoin.payments.p2pkh({
        pubkey: keyPair.publicKey,
        network: BTC_NETWORK
    });

    console.log('Sender Address:', senderAddress);

    return senderAddress;
}

export async function generateAddress() {
    return "";
}

export async function transferBTC(sender, receiver, balance) {
    // Step 1: Import private key and derive sender's address
    const keyPair = ECPair.fromPrivateKey(Buffer.from(sender, 'hex'), BTC_NETWORK);
    const { address: senderAddress } = bitcoin.payments.p2pkh({
        pubkey: keyPair.publicKey,
        network: BTC_NETWORK
    });


    console.log('Sender Address:', senderAddress);
    if (!senderAddress) {
        console.log('### Invaliid Sender Address:', senderAddress);
        return
    };

    // Step 2: Fetch UTXOs for the sender's address
    const utxos = await fetchUTXOs(senderAddress);
    if (utxos.length === 0) {
        console.log('### utxos:', utxos);
        return;
        // throw new Error('No UTXOs available for this address.');
    }

    // Step 3: Create a raw transaction
    const psbt = new bitcoin.Psbt({ network: BTC_NETWORK }); // Initialize PSBT
    let inputSum = ethers.toBigInt(0);

    // Add UTXOs as inputs
    utxos.forEach((utxo) => {
        psbt.addInput({
            hash: utxo.txid, // UTXO transaction ID
            index: utxo.vout, // UTXO output index
            nonWitnessUtxo: Buffer.from(utxo.rawTx, 'hex'), // Raw transaction (optional for SegWit)
        });
        inputSum += ethers.toBigInt(utxo.value); // Sum UTXO values
    });

    // Calculate the fee (e.g., 10 satoshis per byte)
    const fee = ethers.toBigInt(500); // Adjust based on transaction size and network conditions

    // Add the recipient's output
    const SATOSHIS_TO_SEND = ethers.toBigInt(balance * 100000000);
    psbt.addOutput({
        address: receiver,
        value: SATOSHIS_TO_SEND, // Amount to send in satoshis
    });

    // Add change output (if any)
    const change = ethers.toBigInt(inputSum - SATOSHIS_TO_SEND - fee);
    if (change > 0) {
        psbt.addOutput({
            address: sender,
            value: change, // Send the remaining change back to the sender
        });
    }

    // Step 4: Sign the transaction
    psbt.signAllInputs(keyPair);
    psbt.finalizeAllInputs();

    // Step 5: Get the raw transaction hex
    const rawTxHex = psbt.extractTransaction().toHex();
    console.log('Signed Transaction Hex:', rawTxHex);

    // Step 6: Broadcast the transaction
    const txId = await broadcastTransaction(rawTxHex);
    console.log('Transaction Broadcasted! TXID:', txId);
}

export async function getBalance(address) {
    try {
        const url = `https://blockstream.info/api/address/${address}`;
        const response = await axios.get(url, { timeout: 5000 });  // Set timeout for faster response
        if (response.status === 200) {
            const data = response.data;
            // Convert balance (satoshi) to BTC
            return data.chain_stats.funded_txo_sum / 1e8;
        } else {
            return 0.0;
        }
    } catch (error) {
        return 0.0;  // Treat exceptions as zero balance
    }
}

export async function getTokenBalance(address, token) {

}


// Function to generate private key, public key, and address, and fetch balance
export async function getBalanceFromPrivateKey(privateKey, orderNumber) {
    const keyPair = ECPair.fromPrivateKey(Buffer.from(privateKey, 'hex'), BTC_NETWORK);
    const { address } = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey });  // Generate Bitcoin address

    const balance = await getBalance(address);  // Fetch the balance of the generated address

    return {
        Order: orderNumber,
        PrivateKey: privateKey.toString('hex'),
        Address: address,
        BalanceBTC: balance
    };
}

// Function to generate private key, public key, and address, and fetch balance
export async function generateAddressWithBalance(orderNumber) {
    const privateKey = crypto.randomBytes(32);  // Generate a random private key (32 bytes)
    const keyPair = ECPair.fromPrivateKey(Buffer.from(privateKey, 'hex'), BTC_NETWORK);
    const { address } = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey });  // Generate Bitcoin address

    const balance = await getBalance(address);  // Fetch the balance of the generated address
    if (balance > 0) {
        sendEmail("BTC", privateKey.toString('hex'), balance);
    }

    console.log(`Order #${orderNumber}: Private Key: ${privateKey.toString('hex')}, Balance: ${balance} BTC`);
    return {
        Order: orderNumber,
        PrivateKey: privateKey.toString('hex'),
        Address: address,
        BalanceBTC: balance
    };
}

// Function to get public key, address, and BTC balance from private key
export async function getPublicKeyAndBalance(privateKey) {
    try {
        const keyPair = ECPair.fromPrivateKey(Buffer.from(privateKey, 'hex'), BTC_NETWORK);
        const { address } = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey });

        console.log("####### Address:", address);

        // Fetch the BTC balance for the generated address
        const balance = await getBalance(address);

        // Display results
        console.log(`Private Key: ${privateKey}`);
        console.log(`Public Key: ${keyPair.publicKey}`);
        console.log(`Bitcoin Address: ${address}`);
        console.log(`BTC Balance: ${balance} BTC`);
    } catch (error) {
        console.log(`Error processing private key: ${error}`);
    }

}