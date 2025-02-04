import NoSSRWrapper from '@/containers/NoSSRWrapper';
import Converter from './Converter';



export default function Page() {
    return (
        <NoSSRWrapper>
            <Converter />
        </NoSSRWrapper>
    );
}
