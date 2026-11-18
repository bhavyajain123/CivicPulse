import { api } from "./api";

export type IncidentOverview = {
  totalIncidents: number;
  pendingIncidents: number;
  verifiedIncidents: number;
  assignedIncidents: number;
  resolvedIncidents: number;
};

export type PriorityStatistic = {
  _id: string;
  count: number;
};

export type CategoryStatistic = {
  _id: string;
  count: number;
};

export type MonthlyStatistic = {
  _id: {
    year: number;
    month: number;
  };
  count: number;
};

export type TeamStatistic = {
  name: string;
  departmentId?: string;
  memberCount: number;
  isAvailable: boolean;
  totalIncidentsHandled: number;
  resolved: number;
  currentlyAssigned: number;
};

export type DepartmentStatistic = {
  _id: string;
  name: string;
  teamCount: number;
  availableTeams: number;
};

export type DashboardStatistics = {
  overview: IncidentOverview;
  priority: PriorityStatistic[];
  category: CategoryStatistic[];
  monthly: MonthlyStatistic[];
  teams: TeamStatistic[];
  departments: DepartmentStatistic[];
};

type AnalyticsApiResponse<T> = {
  success: boolean;
  message: string;
  statistics: T;
};

async function fetchStatistics<T>(endpoint: string): Promise<T> {
  const response = await api<AnalyticsApiResponse<T>>(endpoint);

  if (!response.success) {
    throw new Error(response.message || "Failed to fetch analytics");
  }

  return response.statistics;
}

export const analyticsService = {
  getDashboard: () =>
    fetchStatistics<DashboardStatistics>("/analytics/dashboard"),
  getOverview: () =>
    fetchStatistics<IncidentOverview>("/analytics/overview"),
  getPriority: () =>
    fetchStatistics<PriorityStatistic[]>("/analytics/priority"),
  getCategory: () =>
    fetchStatistics<CategoryStatistic[]>("/analytics/category"),
  getMonthly: () =>
    fetchStatistics<MonthlyStatistic[]>("/analytics/monthly"),
  getTeams: () =>
    fetchStatistics<TeamStatistic[]>("/analytics/teams"),
  getDepartments: () =>
    fetchStatistics<DepartmentStatistic[]>("/analytics/departments")
};