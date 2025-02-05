import React from 'react';



export default function PageDetail({
    name,
    children,
    fullWidth,
} : {
    name?: string,
    children: React.ReactNode,
    fullWidth?: boolean,
}) {
    return (
        <div
            className={
                `pt-48 m-auto p-4 ${fullWidth ? 'w-full' : 'max-w-[800px]'}`
            }
        >
            {name && (
                <h1
                    className="grid place-content-center text-4xl lg:text-6xl mt-24 mb-24"
                >
                    {name}
                </h1>
            )}

            {children}
        </div>
    );
}
