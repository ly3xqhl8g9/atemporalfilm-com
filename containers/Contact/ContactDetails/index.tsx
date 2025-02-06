'use client';

import { useContext } from 'react';

import { LanguageContext } from '@/app/context';
import {
    Language,
} from '@/data/index';

import {
    ContactIcon,
} from '@/data/icons';

import {
    LocalizedContent,
    Section,
    sections,
} from '@/data/contact';



const CONTACT_INDEX = 30;

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


    const getLocalizedContent = (content: string | LocalizedContent<Language> | any) => {
        if (typeof content === 'string') return content;
        if (content && content[language]) return content[language];
        return content;
    };

    const renderSection = (section: Section, index: number) => {
        return (
            <div
                key={index}
                className={`mb-8 transition-all duration-300 ${
                    hoveredIndex !== null && hoveredIndex !== index ? 'text-gray-900' : 'text-gray-400'
                }`}
                onMouseEnter={() => setHoveredIndex?.(index)}
                onMouseLeave={() => setHoveredIndex?.(null)}
            >
                {section.type === 'locations' && (
                    <h4 className="text-lg mb-1">{section.title[language]}</h4>
                )}

                {section.type === 'person' && (
                    <>
                        <p>{section.content.name}</p>
                        <p>{getLocalizedContent(section.content.title)}</p>
                        {section.content.contact.map((item, i) => (
                            <p key={i}>
                                <a href={item.href} className="underline">
                                    {item.value}
                                </a>
                            </p>
                        ))}
                    </>
                )}

                {section.type === 'email' && section.content.contact.map((item, i) => (
                    <p key={i}>
                        <a href={item.href} className="underline">
                            {item.value}
                        </a>
                    </p>
                ))}

                {section.type === 'locations' && section.content[language].map((item, i) => (
                    <p key={i}>{item}</p>
                ))}
            </div>
        );
    };

    return (
        <div className="text-right text-lg w-full px-8">
            <button
                className={`text-xl my-8 ${
                    hoveredIndex !== null && hoveredIndex !== CONTACT_INDEX ? 'text-gray-900' : 'text-white'
                }`}
                onClick={() => {
                    setShowForm(true);
                    setHoveredIndex?.(null);
                }}
                onMouseEnter={() => setHoveredIndex?.(30)}
                onMouseLeave={() => setHoveredIndex?.(null)}
            >
                {language === 'en' ? 'Contact Us Here' : 'Formular de Contact'}

                <ContactIcon
                    stroke={hoveredIndex !== null && hoveredIndex !== CONTACT_INDEX ? '#212121' : '#ffffff'}
                />
            </button>

            {sections.map((section, index) => renderSection(section, index))}
        </div>
    );
}
