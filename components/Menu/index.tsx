import Link from 'next/link';


const items = [
    'features',
    'shorts',
    'commercial',
    'about',
    'contact',
    'project',
];


export default function Menu() {
    return (
        <div>
            <ul>
                {items.map(item => {
                    return (
                        <div
                            key={item}
                        >
                            <Link
                                href={'/' + item}
                            >
                                {item}
                            </Link>
                        </div>
                    );
                })}
            </ul>
        </div>
    );
}
