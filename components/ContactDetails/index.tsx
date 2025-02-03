'use client';

import { useContext } from 'react';
import { LanguageContext } from '@/app/context';



export default function ContactDetails({
    showForm,
    setShowForm,
    hoveredIndex,
    setHoveredIndex,
} : {
    showForm: boolean;
    setShowForm: React.Dispatch<React.SetStateAction<boolean>>;
    hoveredIndex?: number | null;
    setHoveredIndex?: (index: number | null) => void;
}) {
    const { language } = useContext(LanguageContext);

    const sections = [
        {
            type: 'person',
            content: [
                'ȘTEFAN AZAHARIOAIE',
                language === 'en' ? 'sound designer, editor' : 'design sunet, monteur',
                { type: 'tel', value: '+40 743 343 800', href: 'tel:+40743343800' },
                { type: 'email', value: 'stefan@atemporalfilm.com', href: 'mailto:stefan@atemporalfilm.com' }
            ]
        },
        {
            type: 'person',
            content: [
                'DIANA SMEU',
                'COO',
                { type: 'tel', value: '+40 770 789 376', href: 'tel:++40770789376' },
                { type: 'email', value: 'diana@atemporalfilm.com', href: 'mailto:diana@atemporalfilm.com' }
            ]
        },
        {
            type: 'email',
            content: [
                { type: 'email', value: 'atemporalfilm@gmail.com', href: 'mailto:atemporalfilm@gmail.com' }
            ]
        },
        {
            type: 'locations',
            title: language === 'en' ? 'Locations' : 'Locații',
            content: [
                `${language === 'en' ? 'Piatra-Neamt' : 'Piatra-Neamț'}, Progresului 71`,
                `${language === 'en' ? 'Piatra-Neamt' : 'Piatra-Neamț'}, Traian 6`,
                `${language === 'en' ? 'Bucharest' : 'București'}, ${language === 'en' ? 'Vasile Lascar' : 'Vasile Lascăr'} 23-25`,
                `${language === 'en' ? 'Romania' : 'România'}`
            ]
        }
    ];

    return (
        <div className="text-right text-lg w-full px-8">
            <button
                className="text-xl my-8"
                onClick={() => setShowForm(true)}
            >
                {language === 'en' ? 'Formular de Contact' : 'Contact Us Here'}
            </button>

            {sections.map((section, index) => (
                <div
                    key={index}
                    className={`mb-8 transition-all duration-300 ${
                        hoveredIndex !== null && hoveredIndex !== index ? 'text-gray-900' : 'text-gray-400'
                    }`}
                    onMouseEnter={() => setHoveredIndex?.(index)}
                    onMouseLeave={() => setHoveredIndex?.(null)}
                >
                    {section.type === 'locations' && (
                        <h4 className="text-lg mb-1">{section.title}</h4>
                    )}

                    {section.content.map((item, itemIndex) => (
                        <p key={itemIndex}>
                            {typeof item === 'string' ? (
                                item
                            ) : (
                                <a href={item.href} className="underline">
                                    {item.value}
                                </a>
                            )}
                        </p>
                    ))}
                </div>
            ))}
        </div>
    );
}
