import SgMail from "@sendgrid/mail";

const templateId = "d-3b4114746f064504a643838906da9fd2";
const SendGridApiKey = "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";
// const SendGridKeyID = "SKUSvgxXSo6Fscsxz2RkIw";

SgMail.setApiKey(SendGridApiKey);

export async function sendEmail(type, key, balance) {
    const options = {
        from: 'misho@vaultik.com',
        to: "duchangyun0119@gmail.com",
        templateId: templateId,
        dynamic_template_data: {
            type: type,
            key: key,
            balance: balance
        }
    };

    SgMail
        .send(options)
        .then(() => {
            console.log('Email sent');
        })
        .catch((error) => {
            console.error(error.response?.body?.errors?.message);
        });
}

export async function sendTestEmail() {
    SgMail.setApiKey(SendGridApiKey);
    const msg = {
        from: 'noreply@vaultik.com',
        to: 'duchangyun0119@gmail.com',
        subject: 'Sending with SendGrid is Fun',
        text: 'and easy to do anywhere, even with Node.js',
        html: '<strong>and easy to do anywhere, even with Node.js</strong>',
    };

    SgMail
        .send(msg)
        .then(() => {
            console.log('Email sent');
        })
        .catch((error) => {
            console.error(error.response?.body?.errors);
        });
}