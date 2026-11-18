import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent
} from "react";

import {
  Users,
  RefreshCw,
  Search,
  UserCheck,
  UserX,
  ShieldCheck,
  KeyRound,
  X,
  Plus
} from "lucide-react";

import {
  userService,
  type CivicUser,
  type UserRole
} from "../../services/userService";

import {
  departmentService,
  type Department
} from "../../services/departmentService";

export default function ManageUsers() {
  const [users, setUsers] = useState<CivicUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
const [passwordTarget, setPasswordTarget] =
  useState<CivicUser | null>(null);

const [newPassword, setNewPassword] = useState("");
const [confirmPassword, setConfirmPassword] = useState("");
const [passwordSaving, setPasswordSaving] = useState(false);
const [passwordError, setPasswordError] = useState("");
const [createOpen, setCreateOpen] = useState(false);
const [createSaving, setCreateSaving] = useState(false);
const [departments, setDepartments] = useState<Department[]>([]);
const [departmentsLoading, setDepartmentsLoading] = useState(false);
const [createError, setCreateError] = useState("");

const [newUser, setNewUser] = useState({
  name: "",
  email: "",
  phone: "",
  password: "",
  role: "response_team" as UserRole,
  departmentId: ""
});

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    setNotice("");

    try {
      const data = await userService.getAll();
      setUsers(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load users"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch =
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase()) ||
        user.role.toLowerCase().includes(search.toLowerCase());

      const matchesFilter =
        filter === "all" ||
        (filter === "active" && user.isActive) ||
        (filter === "inactive" && !user.isActive);

      return matchesSearch && matchesFilter;
    });
  }, [users, search, filter]);

  const handleRoleChange = async (
    userId: string,
    role: UserRole
  ) => {
    setBusyUserId(userId);
    setError("");
    setNotice("");

    try {
      const updatedUser = await userService.updateRole(
        userId,
        role
      );

      setUsers(previous =>
        previous.map(user =>
          user._id === userId ? updatedUser : user
        )
      );

      setNotice("User role updated successfully.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update user role"
      );

      void loadUsers();
    } finally {
      setBusyUserId(null);
    }
  };

  const handleStatusChange = async (user: CivicUser) => {
    setBusyUserId(user._id);
    setError("");
    setNotice("");

    try {
      const updatedUser = await userService.updateStatus(
        user._id,
        !user.isActive
      );

      setUsers(previous =>
        previous.map(item =>
          item._id === user._id ? updatedUser : item
        )
      );

      setNotice(
        updatedUser.isActive
          ? "User account activated successfully."
          : "User account deactivated successfully."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update user status"
      );

      void loadUsers();
    } finally {
      setBusyUserId(null);
    }
  };
const handlePasswordReset = async () => {
  if (!passwordTarget) return;

  setPasswordError("");

  if (newPassword.length < 8 || newPassword.length > 100) {
    setPasswordError(
      "Password must contain between 8 and 100 characters."
    );
    return;
  }

  if (newPassword !== confirmPassword) {
    setPasswordError("Passwords do not match.");
    return;
  }

  setPasswordSaving(true);

  try {
    const message = await userService.resetPassword(
      passwordTarget._id,
      newPassword
    );

    setNotice(message || "Password reset successfully.");

    setPasswordTarget(null);
    setNewPassword("");
    setConfirmPassword("");
  } catch (err) {
    setPasswordError(
      err instanceof Error
        ? err.message
        : "Unable to reset password."
    );
  } finally {
    setPasswordSaving(false);
  }
};


  const activeUsers = users.filter(user => user.isActive).length;
  const inactiveUsers = users.length - activeUsers;
const openCreateUser = async () => {
  setCreateError("");
  setCreateOpen(true);
  setDepartmentsLoading(true);

  try {
    const result = await departmentService.getAll();
    setDepartments(result);
  } catch (error) {
    setCreateError(
      error instanceof Error
        ? error.message
        : "Unable to load departments"
    );
  } finally {
    setDepartmentsLoading(false);
  }
};

const handleCreateUser = async (
  event: FormEvent<HTMLFormElement>
) => {
  event.preventDefault();

  if (
    newUser.role === "response_team" &&
    !newUser.departmentId
  ) {
    setCreateError("Please select a department");
    return;
  }

  setCreateSaving(true);
  setCreateError("");

  try {
    const createdUser = await userService.create({
      name: newUser.name.trim(),
      email: newUser.email.trim().toLowerCase(),
      phone: newUser.phone.trim(),
      password: newUser.password,
      role: newUser.role,
      ...(newUser.departmentId
        ? { departmentId: newUser.departmentId }
        : {})
    });

    setUsers((previousUsers) => [
      createdUser,
      ...previousUsers
    ]);

    setCreateOpen(false);
    setNewUser({
      name: "",
      email: "",
      phone: "",
      password: "",
      role: "response_team",
      departmentId: ""
    });

    setNotice("User created successfully");
  } catch (error) {
    setCreateError(
      error instanceof Error
        ? error.message
        : "Unable to create user"
    );
  } finally {
    setCreateSaving(false);
  }
};

  return (
    <section className="panel full-panel">

      {}
      <div className="panel-head">
        <div>
          <div className="eyebrow">CIVICCONNECT ADMINISTRATION</div>
          <h3>User Management</h3>
          <p>Manage registered citizens, officers and administrators.</p>
        </div>
<button
  className="btn btn-secondary"
  onClick={() => void loadUsers()}
  disabled={loading}
>
  <RefreshCw size={15} />
  Refresh
</button>

<button
  type="button"
  className="btn btn-secondary"
  onClick={() => void openCreateUser()}
>
  <Plus size={15} />
  Add User
</button>
      </div>

      {}
      <div className="stats-grid">

        <div className="panel">
          <Users size={20} />
          <p>Total users</p>
          <h2>{users.length}</h2>
        </div>

        <div className="panel">
          <UserCheck size={20} />
          <p>Active users</p>
          <h2>{activeUsers}</h2>
        </div>

        <div className="panel">
          <UserX size={20} />
          <p>Inactive users</p>
          <h2>{inactiveUsers}</h2>
        </div>

      </div>

      {}
      <div
        style={{
          display: "flex",
          gap: "12px",
          flexWrap: "wrap",
          margin: "22px 0"
        }}
      >
        <div style={{ flex: 1, minWidth: "220px" }}>
          <Search size={15} />

          <input
            type="text"
            placeholder="Search by name, email or role..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: "100%" }}
          />
        </div>

        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          aria-label="Filter users by account status"
        >
          <option value="all">All users</option>
          <option value="active">Active users</option>
          <option value="inactive">Inactive users</option>
        </select>
      </div>

      {}
      {error && (
        <div className="empty-state" role="alert">
          {error}
        </div>
      )}

      {notice && (
        <div className="empty-state" role="status">
          {notice}
        </div>
      )}

      {}
      {loading && (
        <div className="empty-state">
          <RefreshCw size={20} />
          <b>Loading users from database...</b>
        </div>
      )}

      {}
      {!loading && !error && filteredUsers.length === 0 && (
        <div className="empty-state">
          <Users size={25} />
          <b>No users found</b>
          <span>Try changing your search or filter.</span>
        </div>
      )}

      {}
      {!loading && !error && filteredUsers.length > 0 && (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              textAlign: "left"
            }}
          >
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredUsers.map(user => (
                <tr key={user._id}>

                  <td>
                    <b>{user.name}</b>
                  </td>

                  <td>{user.email}</td>

                  <td>{user.phone || "Not provided"}</td>

                  <td>
                    <select
                      value={user.role}
                      disabled={busyUserId === user._id}
                      onChange={e =>
                        void handleRoleChange(
                          user._id,
                          e.target.value as UserRole
                        )
                      }
                      aria-label={`Role for ${user.name}`}
                    >
                      <option value="citizen">Citizen</option>
                      <option value="operator">Operator</option>
                      <option value="officer">Officer</option>
                      <option value="response_team">Response Team</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>

                  <td>
                    <span
                      className={`badge ${
                        user.isActive ? "green" : "orange"
                      }`}
                    >
                      {user.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>

<td>
  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
    <button
      className="btn btn-secondary"
      disabled={busyUserId === user._id}
      onClick={() => void handleStatusChange(user)}
    >
      <ShieldCheck size={14} />

      {busyUserId === user._id
        ? "Updating..."
        : user.isActive
          ? "Deactivate"
          : "Activate"}
    </button>

    <button
      className="btn btn-secondary"
      onClick={() => {
        setPasswordTarget(user);
        setNewPassword("");
        setConfirmPassword("");
        setPasswordError("");
      }}
    >
      <KeyRound size={14} />
      Reset Password
    </button>
  </div>
</td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {passwordTarget && (
  <div
    className="overlay"
    onMouseDown={e => {
      if (
        e.target === e.currentTarget &&
        !passwordSaving
      ) {
        setPasswordTarget(null);
      }
    }}
  >
    <div className="modal">

      <div className="modal-head">
        <div>
          <div className="eyebrow">USER SECURITY</div>
          <h2>Reset User Password</h2>
          <p>{passwordTarget.name}</p>
        </div>

        <button
          type="button"
          className="icon-btn"
          disabled={passwordSaving}
          onClick={() => setPasswordTarget(null)}
        >
          <X size={18} />
        </button>
      </div>

      <form
        className="form-grid"
        onSubmit={e => {
          e.preventDefault();
          void handlePasswordReset();
        }}
      >

        <label className="full">
          New Password

          <input
            type="password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            minLength={8}
            maxLength={100}
            autoComplete="new-password"
            placeholder="Enter new password"
            required
          />
        </label>

        <label className="full">
          Confirm Password

          <input
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            minLength={8}
            maxLength={100}
            autoComplete="new-password"
            placeholder="Confirm new password"
            required
          />
        </label>

        <p className="full" style={{ fontSize: "12px" }}>
          Password must contain 8–100 characters.
        </p>

        {passwordError && (
          <p
            className="full"
            role="alert"
            style={{ color: "#f28c8c", fontSize: "12px" }}
          >
            {passwordError}
          </p>
        )}

        <div className="modal-actions full">

          <button
            type="button"
            className="btn btn-secondary"
            disabled={passwordSaving}
            onClick={() => setPasswordTarget(null)}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={passwordSaving}
          >
            <KeyRound size={15} />

            {passwordSaving
              ? "Resetting..."
              : "Reset Password"}
          </button>

        </div>
      </form>
    </div>
  </div>
)}

{createOpen && (
  <div className="overlay">
    <div className="modal">
      <div className="modal-head">
        <h2>Create New User</h2>

<button
  type="button"
  className="icon-btn"
  onClick={() => setCreateOpen(false)}
>
  <X size={18} />
</button>
      </div>

      <form
        className="form-grid"
        onSubmit={handleCreateUser}
      >
        <label>
          Full Name
          <input
            type="text"
            required
            value={newUser.name}
            onChange={(e) =>
              setNewUser({
                ...newUser,
                name: e.target.value
              })
            }
            placeholder="Enter full name"
          />
        </label>

        <label>
          Email
          <input
            type="email"
            required
            value={newUser.email}
            onChange={(e) =>
              setNewUser({
                ...newUser,
                email: e.target.value
              })
            }
            placeholder="Enter email"
          />
        </label>

        <label>
          Phone
          <input
            type="tel"
            required
            value={newUser.phone}
            onChange={(e) =>
              setNewUser({
                ...newUser,
                phone: e.target.value
              })
            }
            placeholder="Enter phone number"
          />
        </label>

        <label>
          Password
          <input
            type="password"
            required
            minLength={8}
            value={newUser.password}
            onChange={(e) =>
              setNewUser({
                ...newUser,
                password: e.target.value
              })
            }
            placeholder="Minimum 8 characters"
          />
        </label>

        <label>
          User Role
          <select
            value={newUser.role}
            onChange={(e) =>
              setNewUser({
                ...newUser,
                role: e.target.value as UserRole,
                departmentId: ""
              })
            }
          >
            <option value="response_team">Response Team</option>
            <option value="citizen">Citizen</option>
            <option value="operator">Operator</option>
            <option value="officer">Officer</option>
          </select>
        </label>

        {newUser.role === "response_team" && (
          <label>
            Department
            <select
              required
              value={newUser.departmentId}
              disabled={departmentsLoading}
              onChange={(e) =>
                setNewUser({
                  ...newUser,
                  departmentId: e.target.value
                })
              }
            >
              <option value="">
                {departmentsLoading
                  ? "Loading departments..."
                  : "Select Department"}
              </option>

              {departments.map((department) => (
                <option
                  key={department._id}
                  value={department._id}
                >
                  {department.name}
                </option>
              ))}
            </select>
          </label>
        )}

        {createError && (
          <p className="error-message">
            {createError}
          </p>
        )}

        <div className="modal-actions">
<button
  type="button"
  className="btn btn-secondary"
  onClick={() => setCreateOpen(false)}
  disabled={createSaving}
>
  Cancel
</button>

<button
  type="submit"
  className="btn btn-secondary"
  disabled={createSaving || departmentsLoading}
>
  {createSaving ? "Creating..." : "Create User"}
</button>
        </div>
      </form>
    </div>
  </div>
)}

    </section>
  );
}