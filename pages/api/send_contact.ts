import type {
    NextApiRequest,
    NextApiResponse,
} from 'next';

import Mailjet from 'node-mailjet';



const mailjet = new Mailjet({
    apiKey: process.env.MJ_API_KEY || '',
    apiSecret: process.env.MJ_API_SECRET || '',
});


const composeHTML = (data: {
    name: string;
    phone?: string;
    email: string;
    message: string;
}) => {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Contact Form Submission - atemporalfilm.com</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }
                .header {
                    background-color: #2c3e50;
                    color: white;
                    padding: 20px;
                    border-radius: 5px 5px 0 0;
                }
                .header a {
                    color: white;
                }
                .content {
                    background-color: #f9f9f9;
                    padding: 20px;
                    border: 1px solid #ddd;
                    border-radius: 0 0 5px 5px;
                }
                .field {
                    margin-bottom: 15px;
                }
                .label {
                    font-weight: bold;
                    color: #2c3e50;
                }
                .value {
                    margin-top: 5px;
                    padding: 10px;
                    background-color: white;
                    border: 1px solid #eee;
                    border-radius: 3px;
                }
                .message {
                    white-space: pre-wrap;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1 style="margin: 0;">New Contact Form Submission</h1>
                <p style="margin: 5px 0 0;">atemporalfilm.com</p>
            </div>
            <div class="content">
                <div class="field">
                    <div class="label">Name:</div>
                    <div class="value">${data.name}</div>
                </div>
                ${data.phone ? `
                <div class="field">
                    <div class="label">Phone:</div>
                    <div class="value">${data.phone}</div>
                </div>
                ` : ''}
                <div class="field">
                    <div class="label">Email:</div>
                    <div class="value">${data.email}</div>
                </div>
                <div class="field">
                    <div class="label">Message:</div>
                    <div class="value message">${data.message}</div>
                </div>
            </div>
        </body>
        </html>
    `;
};

const EMAILER_FROM = 'contact@atemporalfilm.com';
const EMAILER_TO = process.env.EMAILER_TO || EMAILER_FROM;


export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse,
) {
    switch (req.method) {
        case 'POST':
            try {
                const data = req.body;

                const request = mailjet
                    .post('send', {'version': 'v3.1'})
                    .request({
                        "Messages":[
                            {
                                "From": {
                                    "Email": EMAILER_FROM,
                                },
                                "To": [
                                    {
                                        "Email": EMAILER_TO,
                                    },
                                ],
                                "Subject": `[contact atemporalfilm.com] ${data.name}`,
                                "TextPart": `[contact atemporalfilm.com] ${JSON.stringify(data)}`,
                                "HTMLPart": composeHTML(data),
                            },
                        ],
                    });

                return request
                    .then((_result) => {
                        res.send({ status: true });
                    })
                    .catch((err) => {
                        res.status(err.statusCode || 500).json(err.message);
                    });
            } catch (err: any) {
                res.status(err.statusCode || 500).json(err.message);
            }
            break;
        default:
            res.setHeader('Allow', req.method || '');
            res.status(405).end('Method Not Allowed');
    }
}
