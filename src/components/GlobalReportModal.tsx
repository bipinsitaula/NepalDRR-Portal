'use client';

import { usePortalStore } from '@/lib/store';
import { ReportIncidentModal } from './ReportIncidentModal';

// App-wide instance of the report dialog, opened through openReport() from anywhere.
export const GlobalReportModal = () => {
  const { isReportOpen, closeReport } = usePortalStore();
  return <ReportIncidentModal open={isReportOpen} onClose={closeReport} />;
};
