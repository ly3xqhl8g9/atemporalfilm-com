export const ContactIcon = ({ stroke }: { stroke: string }) => (
    <svg
        width="20px" height="20px"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        style={{
            display: 'inline',
            padding: '0.1rem',
            marginLeft: '0.3rem',
        }}
    >
        <path
            d="M22 2L2 8.66667L11.5833 12.4167M22 2L15.3333 22L11.5833 12.4167M22 2L11.5833 12.4167"
            stroke={stroke}
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        />
    </svg>
);


export const backArrowIcon = (
    <svg fill="#ffffff" width="24px" height="24px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <rect width="24" height="24" transform="rotate(90 12 12)" opacity="0"/>
        <path d="M13.83 19a1 1 0 0 1-.78-.37l-4.83-6a1 1 0 0 1 0-1.27l5-6a1 1 0 0 1 1.54 1.28L10.29 12l4.32 5.36a1 1 0 0 1-.78 1.64z"/>
    </svg>
);


export const closeIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" fill="#ffffff" viewBox="0 0 50 50" width="18px" height="18px">
        <path d="M 9.15625 6.3125 L 6.3125 9.15625 L 22.15625 25 L 6.21875 40.96875 L 9.03125 43.78125 L 25 27.84375 L 40.9375 43.78125 L 43.78125 40.9375 L 27.84375 25 L 43.6875 9.15625 L 40.84375 6.3125 L 25 22.15625 Z"/>
    </svg>
);
