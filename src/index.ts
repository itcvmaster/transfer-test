import express from 'express';
import { sendEmail } from './utils/email';
import { generateAddressWithBalance, getBalanceFromPrivateKey, sleep } from './utils/blockchain';

const app = express();
app.listen(8008, () => {
    console.log('Transfer App is running..');

    try {
        generateUntilFunded();
    } catch (error) {
        console.log(error);
    }
});

app.get("/", (req, res) => {
    res.status(200).json("Service is running");
});

// Function to handle the generation of addresses concurrently
async function generateUntilFunded(maxThreads = 1) {
    let orderNumber = 1;

    while (true) {
        await sleep(1);

        // Generate tasks for concurrent execution
        generateAddressWithBalance(orderNumber++);
    }
}
