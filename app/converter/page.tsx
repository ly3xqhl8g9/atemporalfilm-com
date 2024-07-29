import NoSSRWrapper from '@/components/NoSSRWrapper';
import Converter from './Converter';



export default function Page() {
    return (
        <NoSSRWrapper>
            <Converter />
        </NoSSRWrapper>
    );
}
