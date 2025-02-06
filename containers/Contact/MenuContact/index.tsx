'use client';

import {
    useRef,
    useContext,
    useState,
    useEffect,
} from 'react';

import Image from 'next/image';

import {
    AppContext
} from '@/app/context';

import ContactDetails from '@/containers/Contact/ContactDetails';
import ContactForm from '@/containers/Contact/ContactForm';
import Socials from '@/containers/Socials';



export default function MenuContact({
    inPage,
} : {
    inPage?: boolean;
}) {
    const {
        setContactMenu,
    } = useContext(AppContext);

    const menuRef = useRef<HTMLDivElement | null>(null);

    const [showForm, setShowForm] = useState(false);
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);


    useEffect(() => {
        if (inPage) {
            return;
        }

        const handleScroll = (event: Event | WheelEvent) => {
            if (window.innerWidth > 800) {
                event.preventDefault();
                event.stopPropagation();
            }
        }

        const handleClickOutside = (event: any /* MouseEvent */) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setContactMenu(false);
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setContactMenu(false);
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: false });
        window.addEventListener('wheel', handleScroll, { passive: false });

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);

            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('wheel', handleScroll);
        };
    }, [
        inPage,
        setContactMenu,
    ]);


    return (
        <div
            ref={menuRef}
            className={inPage
                ? ''
                : 'select-none absolute top-0 left-0 bottom-0 right-0 md:left-auto min-w-[600px] bg-black z-50 grid place-content-center'
            }
        >
            {!inPage && (
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
            )}

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
                <ContactForm
                    setShowForm={setShowForm}
                />
            )}
        </div>
    );
}
