import Image from 'next/image';



const projectImages = [
    'logo-proiect-1.png',
    'logo-proiect-2.png',
    'logo-proiect-3.png',
    'logo-proiect-4.png',
];


export default function ProjectImages() {
    return (
        <div
            className="flex gap-4 place-content-center my-4 p-4 bg-white"
        >
            {projectImages.map(projectImage => (
                <Image
                    key={projectImage}
                    src={`/assets/logos/${projectImage}`}
                    style={{
                        width: 'auto',
                        height: '50px',
                    }}
                    width={100}
                    height={50}
                    alt={projectImage}
                />
            ))}
        </div>
    );
}
