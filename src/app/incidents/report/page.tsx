'use client';

import { useRouter } from 'next/navigation';
import IncidentsPage from '@/app/incidents/page';
import { ReportIncidentModal } from '@/components/ReportIncidentModal';

// Direct links to /incidents/report open the report dialog over the incidents list.
export default function ReportIncidentPage() {
  const router = useRouter();

  return (
    <>
      <IncidentsPage />
      <ReportIncidentModal open onClose={() => router.push('/incidents')} />
    </>
  );
}
