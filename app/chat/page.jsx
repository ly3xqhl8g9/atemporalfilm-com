'use client';

import NoSSRWrapper from '@/components/NoSSRWrapper';

import App from "./App.jsx";
import "./index.css";



export default function Page() {
    return (
        <NoSSRWrapper>
            <App />
        </NoSSRWrapper>
    );
}
