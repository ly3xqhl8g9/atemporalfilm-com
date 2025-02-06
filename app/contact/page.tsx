'use client';

import MenuContact from '@/containers/Contact/MenuContact'



export default function ContactPage() {
    return (
        <div
            className="py-36 grid place-content-center min-h-screen text-center"
        >
            <MenuContact
                inPage={true}
            />
        </div>
    );
}
