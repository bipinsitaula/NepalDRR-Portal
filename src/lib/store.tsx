'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  Incident,
  ResourceItem,
  DisasterAlert,
  UserProfile,
  UserRole,
  ActivityLogItem,
  IncidentStatus,
  HazardType
} from '@/types';
import { ALL_SEED_INCIDENTS } from '@/data/seedIncidents';
import { SEED_RESOURCES } from '@/data/seedResources';
import { SEED_ALERTS } from '@/data/seedAlerts';
import { PROVINCES, DISTRICTS, MUNICIPALITIES } from '@/data/locations';
import { Language, TRANSLATIONS } from '@/data/translations';

export interface FilterState {
  provinceId: string;
  districtId: string;
  municipalityId: string;
  hazardType: string;
  status: string;
  startDate: string;
  endDate: string;
  searchQuery: string;
}

export const DEMO_USERS: Record<UserRole, UserProfile> = {
  public: {
    id: 'user-public-001',
    email: 'citizen.viewer@nepaldrr.gov.np',
    fullName: 'Public Citizen / Researcher',
    role: 'public',
    organization: 'Open Public Access'
  },
  reporter: {
    id: 'user-rep-002',
    email: 'reporter.melamchi@nepaldrr.gov.np',
    fullName: 'Suman Adhikari (Ward Officer)',
    role: 'reporter',
    organization: 'Melamchi Municipal DRR Desk',
    districtId: 'd-spc',
    municipalityId: 'm-melamchi'
  },
  admin: {
    id: 'user-adm-003',
    email: 'admin.neoc@nepaldrr.gov.np',
    fullName: 'Dr. Ramesh Pokharel (Director)',
    role: 'admin',
    organization: 'National Emergency Operations Center (NEOC)'
  }
};

interface PortalStoreContextType {
  // Locale
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof TRANSLATIONS['en'];

  // Auth / Role
  currentUser: UserProfile;
  switchRole: (role: UserRole) => void;

  // Global Filters & Scoping
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  setScopeLocation: (prov?: string, dist?: string, muni?: string) => void;
  resetFilters: () => void;

  // Incidents
  incidents: Incident[];
  filteredIncidents: Incident[];
  addIncident: (incident: Omit<Incident, 'id' | 'createdAt' | 'updates'>) => Promise<string>;
  verifyIncident: (id: string, note?: string) => void;
  rejectIncident: (id: string, reason: string) => void;
  updateIncidentStatus: (id: string, newStatus: IncidentStatus, message: string) => void;
  importIncidentsFromCsv: (newItems: Incident[]) => void;

  // Resources
  resources: ResourceItem[];
  filteredResources: ResourceItem[];
  addResource: (res: Omit<ResourceItem, 'id'>) => void;
  updateResource: (id: string, updates: Partial<ResourceItem>) => void;

  // Alerts
  alerts: DisasterAlert[];
  activeAlerts: DisasterAlert[];
  addAlert: (alert: Omit<DisasterAlert, 'id'>) => void;
  toggleAlertActive: (id: string) => void;

  // Activity Log
  activityLogs: ActivityLogItem[];
  addActivityLog: (action: string, entityType: ActivityLogItem['entityType'], entityId: string, details: string) => void;

  // Report incident dialog
  isReportOpen: boolean;
  openReport: () => void;
  closeReport: () => void;

  // Subscriptions
  subscribersCount: number;
  addSubscriber: (contactType: 'sms' | 'email', contactValue: string, districtId?: string) => void;
}

const PortalStoreContext = createContext<PortalStoreContextType | null>(null);

// Bump the version when seed data changes shape, so stale saved copies are ignored.
const STORAGE_KEYS = {
  incidents: 'nepaldrr_v2_incidents',
  resources: 'nepaldrr_v2_resources',
  alerts: 'nepaldrr_v2_alerts'
};

const INITIAL_FILTERS: FilterState = {
  provinceId: '',
  districtId: '',
  municipalityId: '',
  hazardType: 'all',
  status: 'all',
  startDate: '',
  endDate: '',
  searchQuery: ''
};

const INITIAL_LOGS: ActivityLogItem[] = [
  {
    id: 'log-01',
    userName: 'Dr. Ramesh Pokharel',
    userRole: 'admin',
    action: 'VERIFIED_INCIDENT',
    entityType: 'incident',
    entityId: 'inc-2026-001',
    details: 'Verified flash flood damage in Melamchi Bazaar; escalated to national rescue coordination.',
    timestamp: '2026-10-03T07:15:00Z'
  },
  {
    id: 'log-02',
    userName: 'Dr. Ramesh Pokharel',
    userRole: 'admin',
    action: 'ISSUED_ALERT',
    entityType: 'alert',
    entityId: 'alt-01',
    details: 'Published RED Flood Emergency alert for Chisapani Karnali basin downstream areas.',
    timestamp: '2026-10-03T06:00:00Z'
  },
  {
    id: 'log-03',
    userName: 'Suman Adhikari',
    userRole: 'reporter',
    action: 'REPORTED_INCIDENT',
    entityType: 'incident',
    entityId: 'inc-2026-013',
    details: 'Submitted ground observation of fresh tension cracks in Suryabinayak-7 hillside.',
    timestamp: '2026-09-29T15:00:00Z'
  }
];

export const PortalStoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');
  const [currentUser, setCurrentUser] = useState<UserProfile>(DEMO_USERS.admin);
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);

  // Persistent in-memory / local state for hackathon demo
  // Demo data starts from the seed files on both server and client so the first
  // render matches; saved changes are loaded from localStorage after mount.
  const [incidents, setIncidents] = useState<Incident[]>(ALL_SEED_INCIDENTS);
  const [resources, setResources] = useState<ResourceItem[]>(SEED_RESOURCES);
  const [alerts, setAlerts] = useState<DisasterAlert[]>(SEED_ALERTS);
  const [hasLoadedSaved, setHasLoadedSaved] = useState(false);

  const [activityLogs, setActivityLogs] = useState<ActivityLogItem[]>(INITIAL_LOGS);
  const [subscribersCount, setSubscribersCount] = useState<number>(1284);
  const [isReportOpen, setIsReportOpen] = useState(false);

  useEffect(() => {
    const load = <T,>(key: string): T | null => {
      try {
        const raw = localStorage.getItem(key);
        return raw ? (JSON.parse(raw) as T) : null;
      } catch {
        return null;
      }
    };
    const savedIncidents = load<Incident[]>(STORAGE_KEYS.incidents);
    const savedResources = load<ResourceItem[]>(STORAGE_KEYS.resources);
    const savedAlerts = load<DisasterAlert[]>(STORAGE_KEYS.alerts);
    // Syncing from an external store (localStorage) once on mount.
    /* eslint-disable react-hooks/set-state-in-effect */
    if (savedIncidents) setIncidents(savedIncidents);
    if (savedResources) setResources(savedResources);
    if (savedAlerts) setAlerts(savedAlerts);
    setHasLoadedSaved(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  // Persist changes, but only once saved data has been loaded so the seed never overwrites it.
  useEffect(() => {
    if (!hasLoadedSaved) return;
    try {
      localStorage.setItem(STORAGE_KEYS.incidents, JSON.stringify(incidents));
      localStorage.setItem(STORAGE_KEYS.resources, JSON.stringify(resources));
      localStorage.setItem(STORAGE_KEYS.alerts, JSON.stringify(alerts));
    } catch {}
  }, [hasLoadedSaved, incidents, resources, alerts]);

  const switchRole = (role: UserRole) => {
    setCurrentUser(DEMO_USERS[role]);
    addActivityLog('SWITCHED_ROLE', 'incident', '', `Switched active session to ${role.toUpperCase()} mode.`);
  };

  const setScopeLocation = (prov?: string, dist?: string, muni?: string) => {
    setFilters((prev) => ({
      ...prev,
      provinceId: prov !== undefined ? prov : prev.provinceId,
      districtId: dist !== undefined ? dist : prev.districtId,
      municipalityId: muni !== undefined ? muni : prev.municipalityId
    }));
  };

  const resetFilters = () => {
    setFilters(INITIAL_FILTERS);
  };

  const addActivityLog = (
    action: string,
    entityType: ActivityLogItem['entityType'],
    entityId: string,
    details: string
  ) => {
    const newLog: ActivityLogItem = {
      id: `log-${Date.now()}`,
      userName: currentUser.fullName,
      userRole: currentUser.role,
      action,
      entityType,
      entityId,
      details,
      timestamp: new Date().toISOString()
    };
    setActivityLogs((prev) => [newLog, ...prev.slice(0, 49)]);
  };

  const addIncident = async (newIncidentData: Omit<Incident, 'id' | 'createdAt' | 'updates'>): Promise<string> => {
    const newId = `inc-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
    const newIncident: Incident = {
      ...newIncidentData,
      id: newId,
      createdAt: new Date().toISOString(),
      updates: [
        {
          id: `up-${Date.now()}`,
          incidentId: newId,
          title: 'Incident Initial Report Filed',
          message: `Report lodged by ${currentUser.fullName}. Status set to ${newIncidentData.status}.`,
          statusChange: newIncidentData.status,
          createdAt: new Date().toISOString(),
          authorName: currentUser.fullName,
          authorRole: currentUser.role
        }
      ]
    };

    setIncidents((prev) => [newIncident, ...prev]);
    addActivityLog('REPORTED_INCIDENT', 'incident', newId, `Reported new incident: "${newIncident.title}"`);
    return newId;
  };

  const verifyIncident = (id: string, note?: string) => {
    setIncidents((prev) =>
      prev.map((inc) => {
        if (inc.id === id) {
          const update = {
            id: `up-${Date.now()}`,
            incidentId: id,
            title: 'Incident Verified by DRR Authority',
            message: note || 'Field information verified through district emergency operations center.',
            statusChange: 'verified' as IncidentStatus,
            createdAt: new Date().toISOString(),
            authorName: currentUser.fullName,
            authorRole: currentUser.role
          };
          return {
            ...inc,
            status: 'verified' as IncidentStatus,
            updates: [update, ...inc.updates]
          };
        }
        return inc;
      })
    );
    addActivityLog('VERIFIED_INCIDENT', 'incident', id, `Incident ${id} verified.`);
  };

  const rejectIncident = (id: string, reason: string) => {
    setIncidents((prev) =>
      prev.map((inc) => {
        if (inc.id === id) {
          const update = {
            id: `up-${Date.now()}`,
            incidentId: id,
            title: 'Incident Discredited / Rejected',
            message: `Rejection rationale: ${reason}`,
            statusChange: 'rejected' as IncidentStatus,
            createdAt: new Date().toISOString(),
            authorName: currentUser.fullName,
            authorRole: currentUser.role
          };
          return {
            ...inc,
            status: 'rejected' as IncidentStatus,
            updates: [update, ...inc.updates]
          };
        }
        return inc;
      })
    );
    addActivityLog('REJECTED_INCIDENT', 'incident', id, `Incident ${id} rejected: ${reason}`);
  };

  const updateIncidentStatus = (id: string, newStatus: IncidentStatus, message: string) => {
    setIncidents((prev) =>
      prev.map((inc) => {
        if (inc.id === id) {
          const update = {
            id: `up-${Date.now()}`,
            incidentId: id,
            title: `Status Updated to ${newStatus.replace('_', ' ').toUpperCase()}`,
            message,
            statusChange: newStatus,
            createdAt: new Date().toISOString(),
            authorName: currentUser.fullName,
            authorRole: currentUser.role
          };
          return {
            ...inc,
            status: newStatus,
            updates: [update, ...inc.updates]
          };
        }
        return inc;
      })
    );
    addActivityLog('UPDATED_INCIDENT_STATUS', 'incident', id, `Status updated to ${newStatus}: ${message}`);
  };

  const importIncidentsFromCsv = (newItems: Incident[]) => {
    setIncidents((prev) => [...newItems, ...prev]);
    addActivityLog('BULK_IMPORTED_CSV', 'incident', '', `Imported ${newItems.length} incidents from CSV file.`);
  };

  const addResource = (resData: Omit<ResourceItem, 'id'>) => {
    const newRes: ResourceItem = {
      ...resData,
      id: `res-${Date.now()}`
    };
    setResources((prev) => [newRes, ...prev]);
    addActivityLog('ADDED_RESOURCE', 'resource', newRes.id, `Added emergency resource: ${newRes.name}`);
  };

  const updateResource = (id: string, updates: Partial<ResourceItem>) => {
    setResources((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
    addActivityLog('UPDATED_RESOURCE', 'resource', id, `Updated inventory for resource ${id}`);
  };

  const addAlert = (alertData: Omit<DisasterAlert, 'id'>) => {
    const newAlert: DisasterAlert = {
      ...alertData,
      id: `alt-${Date.now()}`
    };
    setAlerts((prev) => [newAlert, ...prev]);
    addActivityLog('ISSUED_ALERT', 'alert', newAlert.id, `Issued new alert: ${newAlert.title}`);
  };

  const toggleAlertActive = (id: string) => {
    setAlerts((prev) =>
      prev.map((alt) => (alt.id === id ? { ...alt, isActive: !alt.isActive } : alt))
    );
    addActivityLog('TOGGLED_ALERT', 'alert', id, `Toggled alert active state.`);
  };

  const addSubscriber = (contactType: 'sms' | 'email', contactValue: string, districtId?: string) => {
    setSubscribersCount((c) => c + 1);
    addActivityLog(
      'NEW_SUBSCRIPTION',
      'alert',
      '',
      `New alert subscriber via ${contactType.toUpperCase()}: ${contactValue} (${districtId || 'All Districts'})`
    );
  };

  // Filtered incidents based on active filters
  const filteredIncidents = useMemo(() => {
    return incidents.filter((inc) => {
      if (filters.provinceId && inc.provinceId !== filters.provinceId) return false;
      if (filters.districtId && inc.districtId !== filters.districtId) return false;
      if (filters.municipalityId && inc.municipalityId !== filters.municipalityId) return false;
      if (filters.hazardType && filters.hazardType !== 'all' && inc.hazardType !== filters.hazardType) return false;
      if (filters.status && filters.status !== 'all' && inc.status !== filters.status) return false;
      if (filters.startDate && new Date(inc.dateTime) < new Date(filters.startDate)) return false;
      if (filters.endDate && new Date(inc.dateTime) > new Date(filters.endDate)) return false;
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const matches =
          inc.title.toLowerCase().includes(query) ||
          inc.locationName.toLowerCase().includes(query) ||
          inc.description.toLowerCase().includes(query);
        if (!matches) return false;
      }
      return true;
    });
  }, [incidents, filters]);

  // Filtered resources based on active filters
  const filteredResources = useMemo(() => {
    return resources.filter((res) => {
      if (filters.districtId && res.districtId !== filters.districtId) return false;
      if (filters.municipalityId && res.municipalityId && res.municipalityId !== filters.municipalityId) return false;
      return true;
    });
  }, [resources, filters]);

  const activeAlerts = useMemo(() => {
    return alerts.filter((alt) => alt.isActive);
  }, [alerts]);

  const t = TRANSLATIONS[language];

  return (
    <PortalStoreContext.Provider
      value={{
        language,
        setLanguage,
        t,
        currentUser,
        switchRole,
        filters,
        setFilters,
        setScopeLocation,
        resetFilters,
        incidents,
        filteredIncidents,
        addIncident,
        verifyIncident,
        rejectIncident,
        updateIncidentStatus,
        importIncidentsFromCsv,
        resources,
        filteredResources,
        addResource,
        updateResource,
        alerts,
        activeAlerts,
        addAlert,
        toggleAlertActive,
        activityLogs,
        addActivityLog,
        isReportOpen,
        openReport: () => setIsReportOpen(true),
        closeReport: () => setIsReportOpen(false),
        subscribersCount,
        addSubscriber
      }}
    >
      {children}
    </PortalStoreContext.Provider>
  );
};

export const usePortalStore = () => {
  const context = useContext(PortalStoreContext);
  if (!context) {
    throw new Error('usePortalStore must be used within a PortalStoreProvider');
  }
  return context;
};
