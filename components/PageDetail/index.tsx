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
                className="text-4xl md:text-6xl lg:text-8xl grid place-content-center h-screen"
            >
                {name}
            </h1>

            {children}
        </div>
    );
}
