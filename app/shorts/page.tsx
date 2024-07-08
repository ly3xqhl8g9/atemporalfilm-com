import PageDetail from '@/components/PageDetail';
import EntityLoop from '@/components/EntityLoop';



export default function Shorts() {
    return (
        <PageDetail
            name="shorts"
        >
            <EntityLoop
                type="short"
            />
        </PageDetail>
    );
}
