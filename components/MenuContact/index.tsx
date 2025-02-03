'use client';

import {
    useRef,
    useContext,
    useState,
    useEffect,
} from 'react';

import Image from 'next/image';
import {
    usePathname,
} from 'next/navigation';

import {
    AppContext
} from '@/app/context';

import ContactDetails from '@/components/ContactDetails';
import Socials from '@/components/Socials';
import Input from '@/components/Input';



export default function Menu() {
    const pathname = usePathname();

    const {
        contactMenu,
        setContactMenu,
    } = useContext(AppContext);

    const menuRef = useRef<HTMLDivElement | null>(null);

    const [showForm, setShowForm] = useState(false);
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');


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
        }).catch((_error) => {
        });
    }


    // useEffect(() => {
    //     setContactMenu(false);
    // }, [
    //     setContactMenu,
    //     pathname,
    // ]);

    useEffect(() => {
        const handleClickOutside = (event: any) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setContactMenu(false);
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setContactMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [
        setContactMenu,
    ]);


    return (
        <div
            ref={menuRef}
            className="select-none fixed top-0 left-0 bottom-0 right-0 md:left-auto min-w-[600px] bg-black z-50 grid place-content-center"
        >
            <button
                className="flex items-center justify-end w-full px-6"
                tabIndex={-1}
            >
                <Image
                    src="/assets/icons/icon-close.png"
                    alt="menu"
                    height="30"
                    width="30"
                    priority={true}
                    draggable={false}
                    onClick={() => {
                        setContactMenu(false);
                    }}
                    tabIndex={1}
                    className="select-none p-2 focus:outline-none"
                    style={{
                        filter: 'invert(1)',
                    }}
                />
            </button>

            {!showForm && (
                <>
                    <ContactDetails
                        showForm={showForm}
                        setShowForm={setShowForm}
                        hoveredIndex={hoveredIndex}
                        setHoveredIndex={setHoveredIndex}
                    />

                    <Socials
                        hoveredIndex={hoveredIndex}
                        setHoveredIndex={setHoveredIndex}
                    />
                </>
            )}

            {showForm && (
                <div>
                    <Input
                        label="Name"
                        value={name}
                        onChange={(value) => setName(value)}
                    />

                    <Input
                        label="Phone"
                        value={phone}
                        onChange={(value) => setPhone(value)}
                    />

                    <Input
                        label="Email"
                        value={email}
                        onChange={(value) => setEmail(value)}
                    />

                    <Input
                        label="Message"
                        value={message}
                        onChange={(value) => setMessage(value)}
                    />

                    <div
                        className="flex justify-center items-center"
                    >
                        <button
                            onClick={sendForm}
                            className="bg-purple-800 text-white min-w-[200px] px-4 py-2 rounded-none m-auto"
                        >
                            Send
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
