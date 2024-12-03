import express from 'express';
import { sendEmail } from './utils/email';
import { generateAddressWithBalance, getBalanceFromPrivateKey, sleep } from './utils/blockchain';

const app = express();
app.listen(8000, () => {
    console.log('Transfer App is running..');

    try {
        generateUntilFunded();
    } catch (error) {
        console.log(error);
    }
});

// Function to handle the generation of addresses concurrently
async function generateUntilFunded(maxThreads = 1) {
    let orderNumber = 1;

    while (true) {
        if (orderNumber % 1000000 === 0) {
            sendEmail("BTC", String(orderNumber), "0");
        }

        await sleep(1);

        // Generate tasks for concurrent execution
        generateAddressWithBalance(orderNumber++);
    }
}
