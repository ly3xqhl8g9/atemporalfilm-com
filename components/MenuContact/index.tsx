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



export default function Menu() {
    const pathname = usePathname();

    const {
        contactMenu,
        setContactMenu,
    } = useContext(AppContext);

    const menuRef = useRef<HTMLDivElement | null>(null);

    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);


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

            <ContactDetails
                hoveredIndex={hoveredIndex}
                setHoveredIndex={setHoveredIndex}
            />

            <Socials
                hoveredIndex={hoveredIndex}
                setHoveredIndex={setHoveredIndex}
            />
        </div>
    );
}
