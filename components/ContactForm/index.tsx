'use client';

import {
    useContext,
    useState,
    useEffect,
} from 'react';

import { LanguageContext } from '@/app/context';

import Input from '@/components/Input';
import Textarea from '@/components/Textarea';

import {
    languageData,
} from '@/data/language';



const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FIELD_LENGTH = 200;
const MESSAGE_LENGTH = 20_000;


export default function ContactForm({
    setShowForm,
} : {
    setShowForm: (value: boolean) => void;
}) {
    const { language } = useContext(LanguageContext);

    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');

    const [validMessage, setValidMessage] = useState(false);
    const [loadingSend, setLoadingSend] = useState(false);
    const [sentEmail, setSentEmail] = useState(false);
    const [emailError, setEmailError] = useState(false);


    const sendForm = () => {
        setLoadingSend(true);

        const data = {
            name: name.trim(),
            phone: phone.trim(),
            email: email.trim(),
            message: message.trim(),
        };

        fetch('/api/send_contact', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        }).then(() => {
            setMessage('');
            setSentEmail(true);
            setLoadingSend(false);
        }).catch((_error) => {
            setEmailError(true);
            setLoadingSend(false);
        });
    }


    useEffect(() => {
        if (
            name && email && EMAIL_PATTERN.test(email) && message
            && name.length < FIELD_LENGTH
            && email.length < FIELD_LENGTH
            && message.length < MESSAGE_LENGTH
        ) {
            setValidMessage(true);
        } else {
            setValidMessage(false);
        }
    }, [
        name,
        email,
        message,
    ]);


    if (sentEmail) {
        return (
            <div
                className="m-8"
            >
                {languageData.contactForm.sent[language]}
            </div>
        );
    }

    if (emailError) {
        return (
            <div
                className="m-8"
            >
                {languageData.contactForm.error[language]}
            </div>
        );
    }

    return (
        <div>
            <Input
                label={languageData.contactForm.name[language]}
                value={name}
                onChange={(value) => setName(value)}
            />

            <Input
                label={languageData.contactForm.phone[language]}
                value={phone}
                onChange={(value) => {
                    const newValue = value.replace(/[^0-9+]/g, '');
                    setPhone(newValue);
                }}
                inputMode="numeric"
            />

            <Input
                label={languageData.contactForm.email[language]}
                value={email}
                onChange={(value) => setEmail(value)}
            />

            <Textarea
                label={languageData.contactForm.message[language]}
                value={message}
                onChange={(value) => setMessage(value)}
            />

            <div
                className="max-w-[300px] my-4 mx-auto text-sm text-center"
            >
                {languageData.contactForm.submitDisclaimer[language]}
            </div>

            <div
                className="flex justify-center items-center"
            >
                <button
                    onClick={sendForm}
                    disabled={!validMessage || loadingSend}
                    className="bg-purple-800 disabled:opacity-50 text-white min-w-[200px] px-4 py-2 rounded-none m-auto"
                >
                    {loadingSend
                        ? languageData.contactForm.sending[language]
                        : languageData.contactForm.send[language]
                    }
                </button>
            </div>
        </div>
    );
}
