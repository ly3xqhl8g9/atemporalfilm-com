import {
    styleTrim,
} from '@/logic/utilities';



export interface InputProps {
    value: string | number;
    onChange: (value: string) => void;
    placeholder?: string;
    label?: string;
    compact?: boolean;
    centered?: boolean;
    type?: 'text' | 'number';
    min?: number;
    max?: number;
    step?: number;
    inputMode?: 'numeric' | 'decimal' | 'email';
}


const Input: React.FC<InputProps> = ({
    value,
    onChange,
    placeholder,
    label,
    compact,
    centered,
    ...rest
}) => {
    return (
        <div
            className={compact ? 'flex gap-2 justify-between items-center mb-4' : 'm-10 select-none'}
        >
            {label && (
                <label className="block mb-1">{label}</label>
            )}

            <input
                className={styleTrim(`
                    bg-purple-200 text-black placeholder-purple-500
                    focus:outline-none focus:ring-2 focus:ring-purple-800
                    border border-purple-800 rounded-none
                    px-4 py-2
                    ${compact ? 'w-24' : 'w-60 md:w-72'}
                    ${centered ? 'text-center' : 'text-left'}
                `)}
                placeholder={placeholder}
                value={value}
                onChange={(e) => {
                    onChange(e.target.value);
                }}
                onFocus={(e) => {
                    e.target.select();
                }}
                name={label || 'input'}
                lang="en"
                {...rest}
            />
        </div>
    );
};


export default Input;
