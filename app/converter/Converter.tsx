'use client';

import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { useRef, useState } from 'react';



export default function Converter() {
    const [loaded, setLoaded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const ffmpegRef = useRef(new FFmpeg());
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const messageRef = useRef<HTMLParagraphElement | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [transcoded, setTranscoded] = useState(false);


    const load = async () => {
        setIsLoading(true)
        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd'
        const ffmpeg = ffmpegRef.current
        ffmpeg.on('log', ({ message }) => {
            if (messageRef.current) messageRef.current.innerHTML = message
        })
        // toBlobURL is used to bypass CORS issue, urls with the same
        // domain can be used directly.
        await ffmpeg.load({
            coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
            wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm')
        })
        setLoaded(true)
        setIsLoading(false)
    }

    const transcode = async () => {
        if (!file) {
            return;
        }

        const ffmpeg = ffmpegRef.current;
        await ffmpeg.writeFile('input.avi', await fetchFile(file));
        await ffmpeg.exec(['-i', 'input.avi', 'output.mp4']);
        const data = (await ffmpeg.readFile('output.mp4')) as any;
        if (videoRef.current) {
            setTranscoded(true);
            videoRef.current.src = URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }));
        }
    }


    return loaded ? (
        <div className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] min-w-[600px] grid place-content-center justify-items-center">
            <div
                className="mb-4"
            >
                <input
                    type="file"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
            </div>

            {file && (
                <>
                    <video
                        className={(!transcoded ? 'hidden' : '') + ' lg:min-w-[600px]'}
                        ref={videoRef}
                        controls
                    >
                    </video>

                    <br />
                    <button
                        onClick={transcode}
                        className="bg-white text-black py-3 px-6 rounded-full max-w-[300px] mb-4"
                    >
                        transcode avi to mp4
                    </button>

                    <p
                        ref={messageRef}
                        className={transcoded ? 'hidden' : ''}
                    ></p>
                </>
            )}
        </div>
    ) : (
        <button
            className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] min-w-[200px] flex items-center text-center justify-center bg-white rounded-full text-black py-2 px-4 rounded"
            onClick={load}
        >
            load converter
            {isLoading && (
                <span className="animate-spin ml-3">
                    <svg
                        viewBox="0 0 1024 1024"
                        focusable="false"
                        data-icon="loading"
                        width="1em"
                        height="1em"
                        fill="currentColor"
                        aria-hidden="true"
                    >
                        <path d="M988 548c-19.9 0-36-16.1-36-36 0-59.4-11.6-117-34.6-171.3a440.45 440.45 0 00-94.3-139.9 437.71 437.71 0 00-139.9-94.3C629 83.6 571.4 72 512 72c-19.9 0-36-16.1-36-36s16.1-36 36-36c69.1 0 136.2 13.5 199.3 40.3C772.3 66 827 103 874 150c47 47 83.9 101.8 109.7 162.7 26.7 63.1 40.2 130.2 40.2 199.3.1 19.9-16 36-35.9 36z"></path>
                    </svg>
                </span>
            )}
        </button>
    );
}
