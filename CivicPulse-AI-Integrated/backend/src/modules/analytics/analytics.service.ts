
import Incident from "../incidents/incident.model";
import Team from "../response-teams/team.model";
import Department from "../departments/department.model";


export const getIncidentOverview = async () => {
  const [
    totalIncidents,
    pendingIncidents,
    verifiedIncidents,
    assignedIncidents,
    resolvedIncidents
  ] = await Promise.all([
    Incident.countDocuments(),
    Incident.countDocuments({ status: "pending" }),
    Incident.countDocuments({ status: "verified" }),
    Incident.countDocuments({ status: "assigned" }),
    Incident.countDocuments({ status: "resolved" })
  ]);

  return {
    totalIncidents,
    pendingIncidents,
    verifiedIncidents,
    assignedIncidents,
    resolvedIncidents
  };
};

export const getPriorityStatistics = async () => {
  return Incident.aggregate([
    {
      $group: {
        _id: "$priority",
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);
};


export const getCategoryStatistics = async () => {
  return Incident.aggregate([
    {
      $group: {
        _id: "$category",
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]);
};



export const getMonthlyStatistics = async () => {
  const now = new Date();

  const startDate = new Date(
    now.getFullYear(),
    now.getMonth() - 11,
    1
  );

  return Incident.aggregate([
    {
      $match: {
        createdAt: {
          $gte: startDate,
          $lte: now
        }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" }
        },
        count: { $sum: 1 }
      }
    },
    {
      $sort: {
        "_id.year": 1,
        "_id.month": 1
      }
    }
  ]);
};




export const getTeamStatistics = async () => {
  return Team.aggregate([
    {
      $project: {
        name: 1,
        departmentId: 1,
        memberCount: {
          $size: { $ifNull: ["$members", []] }
        },
        isAvailable: 1
      }
    },
    {
      $lookup: {
        from: "incidents",
        localField: "_id",
        foreignField: "assignedTeam",
        as: "incidents"
      }
    },
    {
      $project: {
        name: 1,
        departmentId: 1,
        memberCount: 1,
        isAvailable: 1,
        totalIncidentsHandled: {
          $size: "$incidents"
        },
        resolved: {
          $size: {
            $filter: {
              input: "$incidents",
              as: "incident",
              cond: {
                $eq: ["$$incident.status", "resolved"]
              }
            }
          }
        },
        currentlyAssigned: {
          $size: {
            $filter: {
              input: "$incidents",
              as: "incident",
              cond: {
                $eq: ["$$incident.status", "assigned"]
              }
            }
          }
        }
      }
    }
  ]);
};


export const getDepartmentStatistics = async () => {
  return Department.aggregate([
    {
      $lookup: {
        from: "teams",
        localField: "_id",
        foreignField: "departmentId",
        as: "teams"
      }
    },
    {
      $project: {
        name: 1,
        teamCount: { $size: "$teams" },
        availableTeams: {
          $size: {
            $filter: {
              input: "$teams",
              as: "team",
              cond: { $eq: ["$$team.isAvailable", true] }
            }
          }
        }
      }
    }
  ]);
};

export const getDashboardStatistics = async () => {
  const [
    overview,
    priority,
    category,
    monthly,
    teams,
    departments
  ] = await Promise.all([
    getIncidentOverview(),
    getPriorityStatistics(),
    getCategoryStatistics(),
    getMonthlyStatistics(),
    getTeamStatistics(),
    getDepartmentStatistics()
  ]);

  return {
    overview,
    priority,
    category,
    monthly,
    teams,
    departments
  };
};
