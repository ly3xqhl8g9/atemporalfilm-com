import React from 'react';



export default function PageDetail({
    name,
    children,
} : {
    name: string,
    children: React.ReactNode,
}) {
    return (
        <div
            className="m-auto max-w-[800px] p-4"
        >
            <h1
                className="grid place-content-center text-4xl lg:text-6xl mt-24 mb-24"
            >
                {name}
            </h1>

            {children}
        </div>
    );
}
