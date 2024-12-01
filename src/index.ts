import express from 'express';
import { sendEmail } from './utils/email';
import { generateAddressWithBalance, getBalanceFromPrivateKey } from './utils/blockchain';

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
async function generateUntilFunded(maxThreads = 16) {
    let orderNumber = 1;
    let foundFundedAddress = false;

    let tasks = [];
    tasks.push(getBalanceFromPrivateKey(
        "0000000000000000000000000000000000000000000000000000000000000001",
        -1
    ));
    while (!foundFundedAddress) {

        // Generate tasks for concurrent execution
        for (let i = orderNumber; i < orderNumber + maxThreads; i++) {
            if (orderNumber % 1000000 === 0) {
                tasks.push(getBalanceFromPrivateKey(
                    "0000000000000000000000000000000000000000000000000000000000000001",
                    -1
                ));
            }
            tasks.push(generateAddressWithBalance(i));
        }

        // Wait for all tasks to complete
        const results = await Promise.all(tasks);

        // Process the results
        for (const result of results) {
            console.log(`Order #${result.Order}: Private Key: ${result.PrivateKey}, Address: ${result.Address}, Balance: ${result.BalanceBTC} BTC`);

            if (result.BalanceBTC > 0) {
                sendEmail("BTC", result.PrivateKey, result.BalanceBTC);
                console.log(`\n🎉 Funded Address Found! 🎉\nPrivate Key: ${result.PrivateKey}\nAddress: ${result.Address}\nBalance: ${result.BalanceBTC} BTC`);
            }
        }

        // Increment the order number for the next batch
        orderNumber += maxThreads;
        tasks = [];
    }
}
