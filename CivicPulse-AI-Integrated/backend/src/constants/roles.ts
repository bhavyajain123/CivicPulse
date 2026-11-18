export const USER_ROLES=[
    "citizen",
    "admin",
    "operator",
    "response_team"
]as const;

export type UserRole= (typeof USER_ROLES)[number];

export const USER_ROLES_LABELS:Record<
UserRole, string
>={
    citizen:"Citizen",
    admin:"Administrator",
    operator:"emergency operator",
    response_team:"response team"
};