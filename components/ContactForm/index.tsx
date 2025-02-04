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
    const [sentEmail, setSentEmail] = useState(false);
    const [emailError, setEmailError] = useState(false);


    const sendForm = () => {
        const data = {
            name,
            phone,
            email,
            message,
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
        }).catch((_error) => {
            setEmailError(true);
        });
    }


    useEffect(() => {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (name && email && emailPattern.test(email) && message) {
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
                    disabled={!validMessage}
                    className="bg-purple-800 disabled:opacity-50 text-white min-w-[200px] px-4 py-2 rounded-none m-auto"
                >
                    {languageData.contactForm.send[language]}
                </button>
            </div>
        </div>
    );
}
