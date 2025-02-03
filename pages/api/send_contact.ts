import type {
    NextApiRequest,
    NextApiResponse,
} from 'next';

import Mailjet from 'node-mailjet';



const mailjet = new Mailjet({
    apiKey: process.env.MJ_API_KEY || '',
    apiSecret: process.env.MJ_API_SECRET || '',
});


const composeHTML = (
    data: any,
) => {
    return `<h1>[contact atemporalfilm.com]</h1>

<pre id="data">
${JSON.stringify(
    data, null, 4,
)}
</pre>
`;
}

const EMAILER = 'contact@atemporalfilm.com';


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
                                    "Email": EMAILER,
                                },
                                "To": [
                                    {
                                        "Email": EMAILER,
                                    },
                                ],
                                "Subject": '[contact atemporalfilm.com]',
                                "TextPart": '[contact atemporalfilm.com]',
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
