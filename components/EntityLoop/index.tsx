import {
    data,
    Entity,
} from '@/data/index';

import EntityDetail from '@/components/EntityDetail';



export default function EntityLoop({
    type,
} : {
    type: Entity['type'];
}) {
    return (
        <div>
             {data.filter(item => item.type === type).map((item) => {
                return (
                    <EntityDetail
                        key={item.id}
                        data={item}
                    />
                );
            })}
        </div>
    );
}
