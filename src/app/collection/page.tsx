import { artists } from '@/lib/data';
import { CollectionClient } from '@/components/collection-client';

export default function CollectionPage() {
  return (
    <div className="container py-12">
        <CollectionClient artists={artists} />
    </div>
  );
}
