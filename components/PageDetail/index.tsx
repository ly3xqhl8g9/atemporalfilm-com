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
                className="text-4xl lg:text-6xl grid place-content-center h-96"
            >
                {name}
            </h1>

            {children}
        </div>
    );
}
