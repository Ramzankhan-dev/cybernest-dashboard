// Employees: create, filter, edit, role / department / status changes, device assignment. Super Admin picks an organization first.

import { useEffect, useState } from "react";
import { getDepartments } from "../departments/departmentService";
import { getDevices } from "../devices/deviceService";
import { getAllOrganizations } from "../organizations/organizationService";
import { SetPasswordModal } from "./SetPasswordModal";
import {
  assignEmployeeDevice,
  changeEmployeeDepartment,
  changeEmployeeRole,
  createEmployee,
  deleteEmployee,
  getEmployees,
  setEmployeeStatus,
} from "./employeeService";

export function EmployeesOrgCardsView({ token }) {
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedOrg, setSelectedOrg] = useState(null);

  useEffect(() => {
    getAllOrganizations(token, { limit: 100 })
      .then((data) => setOrgs(data.organizations))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (selectedOrg) {
    return (
      <EmployeesView
        token={token}
        organizationId={selectedOrg.id}
        onBack={() => setSelectedOrg(null)}
        user={{ role: "SuperAdmin", is_super_admin: true }}
      />
    );
  }

  return (
    <section>
      <h2>Employees — by Organization</h2>
      {loading && <p>Loading...</p>}
      {error && <p className="error-text">{error}</p>}
      {!loading && orgs.length === 0 && <p className="empty-state">No organizations yet.</p>}
      {!loading && orgs.length > 0 && (
        <div className="report-grid">
          {orgs.map((org) => (
            <div key={org.id} className="report-card" style={{ cursor: "pointer" }} onClick={() => setSelectedOrg(org)}>
              <h4 style={{ margin: 0 }}>{org.name}</h4>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: "0.3rem 0 0.8rem" }}>
                {org.code} · Admin: {org.admin_name || "—"}
              </p>
              <div className="report-stat">{org.employee_count}</div>
              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>employees</div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export function EmployeesView({ token, organizationId, onBack, user }) {
  const canCreateEmployees = user?.role === "OrganizationAdmin";
  const isSuperAdmin = !!user?.is_super_admin;
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [sort, setSort] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [designation, setDesignation] = useState("");
  const [role, setRole] = useState("Employee");
  const [managerPassword, setManagerPassword] = useState("");
  const [deptId, setDeptId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [deviceInputs, setDeviceInputs] = useState({});
  const [availableDevices, setAvailableDevices] = useState([]);
  const [acting, setActing] = useState(null);
  const [passwordModalEmployee, setPasswordModalEmployee] = useState(null);

  function clearFieldError(field) {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  function load() {
    const params = { page, limit: 20 };
    if (search) params.search = search;
    if (deptFilter) params.department_id = deptFilter;
    if (statusFilter) params.status = statusFilter;
    if (roleFilter) params.role = roleFilter;
    if (sort) params.sort = sort;
    if (organizationId) params.organization_id = organizationId;
    getEmployees(token, params).then((data) => { setEmployees(data.employees); setTotal(data.total); }).catch((err) => setError(err.message));
    const deptParams = organizationId ? { organization_id: organizationId, limit: 100 } : {};
    getDepartments(token, deptParams).then((data) => setDepartments(data.departments)).catch(() => {});
    // Devices with no employee attached yet — the only ones that make sense to assign
    getDevices(token, { organization_id: organizationId, department_id: "unassigned", limit: 200 })
      .then((data) => setAvailableDevices(data.devices))
      .catch(() => {});
  }

  useEffect(() => { load(); }, [page, deptFilter, statusFilter, roleFilter, sort, organizationId]);

  function handleSearchSubmit(e) {
    e.preventDefault();
    setPage(1);
    load();
  }

  function validateEmployeeForm() {
    const errors = {};
    if (!firstName.trim()) errors.firstName = "* Please fill this field";
    if (!lastName.trim()) errors.lastName = "* Please fill this field";
    if (!code.trim()) errors.code = "* Please fill this field";
    if (!email.trim()) errors.email = "* Please fill this field";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errors.email = "* Please enter a valid email";
    if (!deptId) errors.deptId = "* Please select a department";
    if (role === "DepartmentManager" && !managerPassword.trim()) {
      errors.managerPassword = "* Please set a password (min 8 characters)";
    } else if (role === "DepartmentManager" && managerPassword.trim().length < 8) {
      errors.managerPassword = "* Password must be at least 8 characters";
    }
    return errors;
  }

  async function handleCreate(e) {
    e.preventDefault();
    const errors = validateEmployeeForm();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    setSaving(true);
    setError("");
    try {
      await createEmployee(token, {
        first_name: firstName.trim(), last_name: lastName.trim(), employee_code: code.trim(),
        email: email.trim(), phone_number: phone.trim(), designation: designation.trim(),
        role, department_id: deptId, password: role === "DepartmentManager" ? managerPassword : undefined,
      });
      setFirstName(""); setLastName(""); setCode(""); setEmail(""); setPhone(""); setDesignation(""); setRole("Employee"); setDeptId(""); setManagerPassword("");
      setFieldErrors({});
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleAssignDevice(employeeId) {
    const deviceUid = (deviceInputs[employeeId] || "").trim();
    if (!deviceUid) return;
    setActing(employeeId);
    try {
      await assignEmployeeDevice(token, employeeId, deviceUid);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setActing(null);
    }
  }

  async function handleToggleStatus(employee) {
    setActing(employee.id);
    try {
      await setEmployeeStatus(token, employee.id, employee.status === "active" ? "suspended" : "active");
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setActing(null);
    }
  }

  async function handleDepartmentChange(employee, newDeptId) {
    if (!newDeptId) return;
    setActing(employee.id);
    try {
      await changeEmployeeDepartment(token, employee.id, newDeptId);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setActing(null);
    }
  }

  async function handleRoleChange(employee, newRole) {
    let password;
    if (newRole === "DepartmentManager") {
      password = window.prompt(`Set a dashboard login password for ${employee.name} (min 8 characters):`);
      if (!password) return; // cancelled
    }
    setActing(employee.id);
    try {
      await changeEmployeeRole(token, employee.id, newRole, password);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setActing(null);
    }
  }

  async function handleDelete(employee) {
    if (!window.confirm(`Delete employee "${employee.name}"?`)) return;
    try {
      await deleteEmployee(token, employee.id);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section>
      <div className="dash-header-row">
        <h2 style={{ border: "none", margin: 0 }}>Employees</h2>
        {onBack && <button className="ghost-dark" onClick={onBack}>← Back to Organizations</button>}
      </div>
      {canCreateEmployees && (
        <div className="policy-panel" style={{ marginBottom: "1.5rem" }}>
          <form onSubmit={handleCreate} className="policy-form" noValidate>
            <div className="field-group">
              <input
                type="text" placeholder="First name" value={firstName}
                className={fieldErrors.firstName ? "input-error" : ""}
                onChange={(e) => { setFirstName(e.target.value); clearFieldError("firstName"); }}
              />
              {fieldErrors.firstName && <p className="field-error">{fieldErrors.firstName}</p>}
            </div>
            <div className="field-group">
              <input
                type="text" placeholder="Last name" value={lastName}
                className={fieldErrors.lastName ? "input-error" : ""}
                onChange={(e) => { setLastName(e.target.value); clearFieldError("lastName"); }}
              />
              {fieldErrors.lastName && <p className="field-error">{fieldErrors.lastName}</p>}
            </div>
            <div className="field-group">
              <input
                type="text" placeholder="Employee ID, e.g. EMP0001" value={code}
                className={fieldErrors.code ? "input-error" : ""}
                onChange={(e) => { setCode(e.target.value); clearFieldError("code"); }}
              />
              {fieldErrors.code && <p className="field-error">{fieldErrors.code}</p>}
            </div>
            <div className="field-group">
              <input
                type="email" placeholder="Email" value={email}
                className={fieldErrors.email ? "input-error" : ""}
                onChange={(e) => { setEmail(e.target.value); clearFieldError("email"); }}
              />
              {fieldErrors.email && <p className="field-error">{fieldErrors.email}</p>}
            </div>
            <input type="text" placeholder="Phone (optional)" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <input type="text" placeholder="Designation (optional)" value={designation} onChange={(e) => setDesignation(e.target.value)} />
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="Employee">Employee</option>
              <option value="DepartmentManager">Department Manager</option>
            </select>
            {role === "DepartmentManager" && (
              <div className="field-group">
                <input
                  type="password"
                  placeholder="Dashboard password (min 8 characters)"
                  value={managerPassword}
                  className={fieldErrors.managerPassword ? "input-error" : ""}
                  onChange={(e) => { setManagerPassword(e.target.value); clearFieldError("managerPassword"); }}
                />
                {fieldErrors.managerPassword && <p className="field-error">{fieldErrors.managerPassword}</p>}
              </div>
            )}
            <div className="field-group">
              <select
                value={deptId}
                className={fieldErrors.deptId ? "input-error" : ""}
                onChange={(e) => { setDeptId(e.target.value); clearFieldError("deptId"); }}
              >
                <option value="">Select department…</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
              {fieldErrors.deptId && <p className="field-error">{fieldErrors.deptId}</p>}
            </div>
            <button type="submit" disabled={saving}>
              {saving ? "Adding..." : "Add employee"}
            </button>
          </form>
          {error && <p className="error-text">{error}</p>}
        </div>
      )}

      <form onSubmit={handleSearchSubmit} className="policy-form" style={{ marginBottom: "1rem" }}>
        <input type="text" placeholder="Search employees..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select value={deptFilter} onChange={(e) => { setDeptFilter(e.target.value); setPage(1); }}>
          <option value="">All departments</option>
          {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
        <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}>
          <option value="">All roles</option>
          <option value="Employee">Employee</option>
          <option value="DepartmentManager">Department Manager</option>
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="">Sort: Newest</option>
          <option value="name">Sort: Name</option>
          <option value="department">Sort: Department</option>
        </select>
        <button type="submit">Search</button>
        <button type="button" className="ghost-dark" onClick={load}>Refresh</button>
      </form>

      {employees.length === 0 && <p className="empty-state">No employees yet.</p>}
      {employees.length > 0 && (
        <div className="table-scroll"><table>
          <thead>
            <tr>
              <th>Employee ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              {(canCreateEmployees || isSuperAdmin) && <th>Department</th>}
              {canCreateEmployees && <th>Role</th>}
              <th>Device</th>
              <th>Status</th>
              {!isSuperAdmin && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {employees.map((e) => (
              <tr key={e.id}>
                <td className="mono">{e.employee_code}</td>
                <td>{e.name}{e.designation && <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{e.designation}</div>}</td>
                <td>{e.email || "—"}</td>
                <td>{e.phone_number || "—"}</td>
                {canCreateEmployees && (
                  <td>
                    <select value={e.department_id} disabled={acting !== null} onChange={(ev) => handleDepartmentChange(e, ev.target.value)}>
                      {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </td>
                )}
                {isSuperAdmin && <td>{e.department_name || "—"}</td>}
                {canCreateEmployees && (
                  <td>
                    <select value={e.role} disabled={acting !== null} onChange={(ev) => handleRoleChange(e, ev.target.value)}>
                      <option value="Employee">Employee</option>
                      <option value="DepartmentManager">Dept. Manager</option>
                    </select>
                  </td>
                )}
                <td>{e.device_uid ? `${e.model || e.device_uid}` : "Unassigned"}</td>
                <td><span className={`badge ${e.status === "active" ? "active" : "suspended"}`}>{e.status}</span></td>
                {!isSuperAdmin && (
                  <td className="actions">
                    {!e.device_uid && (
                      <>
                        <select
                          style={{ width: "150px" }}
                          value={deviceInputs[e.id] || ""}
                          onChange={(ev) => setDeviceInputs({ ...deviceInputs, [e.id]: ev.target.value })}
                        >
                          <option value="">Select device…</option>
                          {availableDevices.map((d) => (
                            <option key={d.id} value={d.device_uid}>{d.model || d.device_uid} {d.imei ? `(${d.imei.slice(-4)})` : ""}</option>
                          ))}
                        </select>
                        <button disabled={acting !== null || !deviceInputs[e.id]} onClick={() => handleAssignDevice(e.id)}>Assign</button>
                      </>
                    )}
                    <button disabled={acting !== null} onClick={() => handleToggleStatus(e)}>
                      {e.status === "active" ? "Suspend" : "Reinstate"}
                    </button>
                    <button disabled={acting !== null} onClick={() => setPasswordModalEmployee(e)}>Set Password</button>
                    {canCreateEmployees && (
                      <button className="danger" disabled={acting !== null} onClick={() => handleDelete(e)}>Delete</button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table></div>
      )}

      {total > 20 && (
        <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem", justifyContent: "center" }}>
          <button className="ghost-dark" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button>
          <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Page {page} of {Math.ceil(total / 20)}</span>
          <button className="ghost-dark" disabled={page >= Math.ceil(total / 20)} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      )}

      {passwordModalEmployee && (
        <SetPasswordModal
          employee={passwordModalEmployee}
          token={token}
          onClose={() => setPasswordModalEmployee(null)}
          onSaved={() => { setPasswordModalEmployee(null); load(); }}
        />
      )}
    </section>
  );
}
