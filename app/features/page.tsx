import PageDetail from '@/components/PageDetail';

import {
    data,
} from '@/data/index';

import EntityDetail from '@/components/EntityDetail';



export default function Features() {
    return (
        <PageDetail
            name="features"
        >
            {data.filter(item => item.type === 'feature').map((item) => {
                return (
                    <EntityDetail
                        key={item.id}
                        data={item}
                    />
                );
            })}
        </PageDetail>
    );
}
