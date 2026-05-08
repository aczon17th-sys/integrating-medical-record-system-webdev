const API_BASE = "/api";
const token = localStorage.getItem("medicalToken");
const savedUser = localStorage.getItem("medicalUser");
const currentUser = savedUser ? JSON.parse(savedUser) : null;

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`
});

const apiRequest = async (path, options = {}) => {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
};

const requireAuth = () => {
  const publicPages = ["login.html", "index.html", ""];
  const page = window.location.pathname.split("/").pop();

  if (!token && !publicPages.includes(page)) {
    window.location.href = "login.html";
  }

  if (page === "accounts.html" && currentUser?.role !== "admin") {
    window.location.href = "dashboard.html";
  }
};

const applyRoleUi = () => {
  document.querySelectorAll(".admin-only").forEach((element) => {
    element.hidden = currentUser?.role !== "admin";
  });

  document.querySelectorAll(".staff-admin-only").forEach((element) => {
    element.hidden = !["admin", "staff"].includes(currentUser?.role);
  });

  if (currentUser?.role === "patient") {
    document.querySelectorAll('a[href="accounts.html"]').forEach((element) => {
      element.hidden = true;
    });
  }
};

const setMessage = (id, text, isError = false) => {
  const element = document.getElementById(id);

  if (!element) {
    return;
  }

  element.textContent = text;
  element.style.color = isError ? "#b42318" : "#17796e";
};

const escapeHtml = (value = "") => {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
};

const setupLogin = () => {
  const form = document.getElementById("loginForm");

  if (!form) {
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    setMessage("loginMessage", "Signing in...");

    try {
      const data = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: document.getElementById("email").value,
          password: document.getElementById("password").value
        })
      });

      localStorage.setItem("medicalToken", data.token);
      localStorage.setItem("medicalUser", JSON.stringify(data.user));
      window.location.href = "dashboard.html";
    } catch (error) {
      setMessage("loginMessage", error.message, true);
    }
  });
};

const setupLogout = () => {
  const button = document.getElementById("logoutBtn");
  const userLabel = document.getElementById("currentUser");

  if (userLabel && currentUser) {
    userLabel.textContent = `${currentUser.email} (${currentUser.role})`;
  }

  if (!button) {
    return;
  }

  button.addEventListener("click", () => {
    localStorage.removeItem("medicalToken");
    localStorage.removeItem("medicalUser");
    window.location.href = "login.html";
  });
};

const loadDashboard = async () => {
  const totalPatients = document.getElementById("totalPatients");

  if (!totalPatients) {
    return;
  }

  try {
    const data = await apiRequest("/dashboard");
    document.getElementById("totalPatients").textContent = data.totalPatients;
    document.getElementById("totalAppointments").textContent = data.totalAppointments;

    const activities = document.getElementById("recentActivities");
    activities.innerHTML = data.recentActivities.length
      ? data.recentActivities
          .map((activity) => `
            <div class="activity-item">
              <strong>${escapeHtml(activity.type)}</strong>
              <p>${escapeHtml(activity.text)}</p>
              <small>${new Date(activity.date).toLocaleString()}</small>
            </div>
          `)
          .join("")
      : "<p class=\"muted\">No recent activities yet.</p>";
  } catch (error) {
    document.getElementById("recentActivities").innerHTML =
      `<p class="message">${escapeHtml(error.message)}</p>`;
  }
};

const patientPayload = () => ({
  fullname: document.getElementById("fullname").value,
  accountEmail: document.getElementById("accountEmail")?.value,
  accountPassword: document.getElementById("accountPassword")?.value,
  validIdType: document.getElementById("validIdType").value,
  validIdNumber: document.getElementById("validIdNumber").value,
  identityVerified: true,
  age: document.getElementById("age").value || null,
  gender: document.getElementById("gender").value,
  diagnosis: document.getElementById("diagnosis").value,
  medications: document.getElementById("medications").value
});

const clearPatientForm = () => {
  document.getElementById("patientId").value = "";
  document.getElementById("patientForm").reset();
  document.getElementById("patientFormTitle").textContent = "Add Patient";
  updatePatientAccountFields();
};

const updatePatientAccountFields = () => {
  const isCreate = !document.getElementById("patientId")?.value;
  const canCreateAccount = ["admin", "staff"].includes(currentUser?.role);
  const accountEmail = document.getElementById("accountEmail");
  const accountPassword = document.getElementById("accountPassword");

  if (!accountEmail || !accountPassword) {
    return;
  }

  accountEmail.required = canCreateAccount && isCreate;
  accountPassword.required = canCreateAccount && isCreate;
  accountEmail.disabled = !isCreate;

  if (!isCreate) {
    accountPassword.value = "";
    accountPassword.placeholder = "Leave blank to keep current password";
  } else {
    accountPassword.placeholder = "";
  }
};

const loadPatients = async () => {
  const table = document.getElementById("patientTable");

  if (!table) {
    return;
  }

  const search = document.getElementById("patientSearch").value;
  const patients = await apiRequest(`/patients${search ? `?search=${encodeURIComponent(search)}` : ""}`);

  table.innerHTML = patients.length
    ? patients.map((patient) => `
      <tr>
        <td>${escapeHtml(patient.fullname)}</td>
        <td>${escapeHtml(patient.validIdType || "")}<br><small>${escapeHtml(patient.validIdNumber || "")}</small></td>
        <td>${escapeHtml(patient.email || "")}</td>
        <td>${escapeHtml(patient.age || "")}</td>
        <td>${escapeHtml(patient.gender || "")}</td>
        <td>${escapeHtml(patient.diagnosis || "")}</td>
        <td>${escapeHtml(patient.medications || "")}</td>
        <td>
          <div class="actions">
            ${["admin", "staff"].includes(currentUser?.role)
              ? `<button class="small-button" data-edit-patient="${patient.id}">Edit</button>`
              : ""}
            ${currentUser?.role === "admin"
              ? `<button class="danger-button" data-delete-patient="${patient.id}">Delete</button>`
              : ""}
          </div>
        </td>
      </tr>
    `).join("")
    : "<tr><td colspan=\"8\">No patients found.</td></tr>";
};

const setupPatients = () => {
  const form = document.getElementById("patientForm");

  if (!form) {
    return;
  }

  if (!["admin", "staff"].includes(currentUser?.role)) {
    form.closest(".panel").hidden = true;
  }

  if (currentUser?.role === "patient") {
    document.querySelectorAll(".patient-account-field").forEach((element) => {
      element.hidden = true;
    });
  }

  updatePatientAccountFields();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const id = document.getElementById("patientId").value;

    try {
      await apiRequest(id ? `/patients/${id}` : "/patients", {
        method: id ? "PUT" : "POST",
        body: JSON.stringify(patientPayload())
      });

      clearPatientForm();
      setMessage("patientMessage", "Patient saved successfully.");
      await loadPatients();
    } catch (error) {
      setMessage("patientMessage", error.message, true);
    }
  });

  document.getElementById("resetPatientForm").addEventListener("click", clearPatientForm);
  document.getElementById("patientSearch").addEventListener("input", loadPatients);

  document.getElementById("patientTable").addEventListener("click", async (event) => {
    const editId = event.target.dataset.editPatient;
    const deleteId = event.target.dataset.deletePatient;

    if (editId) {
      const patient = await apiRequest(`/patients/${editId}`);
      document.getElementById("patientId").value = patient.id;
      document.getElementById("fullname").value = patient.fullname || "";
      document.getElementById("accountEmail").value = patient.email || "";
      document.getElementById("accountPassword").value = "";
      document.getElementById("validIdType").value = patient.validIdType || "";
      document.getElementById("validIdNumber").value = patient.validIdNumber || "";
      document.getElementById("age").value = patient.age || "";
      document.getElementById("gender").value = patient.gender || "";
      document.getElementById("diagnosis").value = patient.diagnosis || "";
      document.getElementById("medications").value = patient.medications || "";
      document.getElementById("patientFormTitle").textContent = "Edit Patient";
      updatePatientAccountFields();
    }

    if (deleteId && confirm("Delete this patient?")) {
      await apiRequest(`/patients/${deleteId}`, { method: "DELETE" });
      await loadPatients();
    }
  });

  loadPatients().catch((error) => setMessage("patientMessage", error.message, true));
};

const appointmentPayload = () => ({
  patientName: document.getElementById("patientName").value,
  appointmentDate: document.getElementById("appointmentDate").value,
  appointmentTime: document.getElementById("appointmentTime").value,
  reason: document.getElementById("reason").value,
  status: document.getElementById("status").value
});

const clearAppointmentForm = () => {
  document.getElementById("appointmentId").value = "";
  document.getElementById("appointmentForm").reset();
  document.getElementById("appointmentFormTitle").textContent = "Create Appointment";
};

const loadAppointments = async () => {
  const table = document.getElementById("appointmentTable");

  if (!table) {
    return;
  }

  const appointments = await apiRequest("/appointments");
  table.innerHTML = appointments.length
    ? appointments.map((appointment) => `
      <tr>
        <td>${escapeHtml(appointment.patientName)}</td>
        <td>${escapeHtml(appointment.appointmentDate || "")}</td>
        <td>${escapeHtml(appointment.appointmentTime || "")}</td>
        <td>${escapeHtml(appointment.reason || "")}</td>
        <td><span class="badge">${escapeHtml(appointment.status)}</span></td>
        <td>
          <div class="actions">
            ${currentUser?.role !== "patient"
              ? `<button class="small-button" data-edit-appointment="${appointment.id}">Edit</button>`
              : ""}
            ${appointment.status !== "cancelled"
              ? `<button class="danger-button" data-cancel-appointment="${appointment.id}">Cancel</button>`
              : ""}
            ${currentUser?.role === "admin"
              ? `<button class="danger-button" data-delete-appointment="${appointment.id}">Delete</button>`
              : ""}
          </div>
        </td>
      </tr>
    `).join("")
    : "<tr><td colspan=\"6\">No appointments found.</td></tr>";
};

const setupAppointments = () => {
  const form = document.getElementById("appointmentForm");

  if (!form) {
    return;
  }

  if (!["admin", "staff", "patient"].includes(currentUser?.role)) {
    form.closest(".panel").hidden = true;
  }

  if (currentUser?.role === "patient") {
    const patientName = document.getElementById("patientName");
    const status = document.getElementById("status");
    patientName.closest("label").hidden = true;
    status.closest("label").hidden = true;
    patientName.required = false;
    status.required = false;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const id = document.getElementById("appointmentId").value;

    try {
      await apiRequest(id ? `/appointments/${id}` : "/appointments", {
        method: id ? "PUT" : "POST",
        body: JSON.stringify(appointmentPayload())
      });

      clearAppointmentForm();
      setMessage("appointmentMessage", "Appointment saved successfully.");
      await loadAppointments();
    } catch (error) {
      setMessage("appointmentMessage", error.message, true);
    }
  });

  document.getElementById("resetAppointmentForm").addEventListener("click", clearAppointmentForm);

  document.getElementById("appointmentTable").addEventListener("click", async (event) => {
    const editId = event.target.dataset.editAppointment;
    const cancelId = event.target.dataset.cancelAppointment;
    const deleteId = event.target.dataset.deleteAppointment;

    if (editId) {
      const appointments = await apiRequest("/appointments");
      const appointment = appointments.find((item) => String(item.id) === String(editId));

      document.getElementById("appointmentId").value = appointment.id;
      document.getElementById("patientName").value = appointment.patientName || "";
      document.getElementById("appointmentDate").value = appointment.appointmentDate || "";
      document.getElementById("appointmentTime").value = appointment.appointmentTime || "";
      document.getElementById("reason").value = appointment.reason || "";
      document.getElementById("status").value = appointment.status || "scheduled";
      document.getElementById("appointmentFormTitle").textContent = "Update Appointment";
    }

    if (cancelId) {
      await apiRequest(`/appointments/${cancelId}`, {
        method: "PUT",
        body: JSON.stringify({ status: "cancelled" })
      });
      await loadAppointments();
    }

    if (deleteId && confirm("Delete this appointment?")) {
      await apiRequest(`/appointments/${deleteId}`, { method: "DELETE" });
      await loadAppointments();
    }
  });

  loadAppointments().catch((error) => setMessage("appointmentMessage", error.message, true));
};

const accountPayload = () => {
  const payload = {
    username: document.getElementById("accountUsername").value,
    email: document.getElementById("accountEmail").value,
    role: document.getElementById("accountRole").value,
    licenseId: document.getElementById("licenseId").value,
    staffId: document.getElementById("staffId").value,
    patientId: document.getElementById("accountPatientId").value || null
  };
  const password = document.getElementById("accountPassword").value;

  if (password) {
    payload.password = password;
  }

  return payload;
};

const clearAccountForm = () => {
  document.getElementById("accountId").value = "";
  document.getElementById("accountForm").reset();
  document.getElementById("accountFormTitle").textContent = "Create Account";
  document.getElementById("accountPassword").required = true;
  updateCredentialFields();
};

const updateCredentialFields = () => {
  const role = document.getElementById("accountRole")?.value;
  const licenseField = document.getElementById("licenseIdField");
  const staffField = document.getElementById("staffIdField");
  const licenseInput = document.getElementById("licenseId");
  const staffInput = document.getElementById("staffId");
  const patientField = document.getElementById("patientIdField");
  const patientInput = document.getElementById("accountPatientId");

  if (!licenseField || !staffField || !patientField) {
    return;
  }

  licenseField.hidden = role !== "doctor";
  staffField.hidden = role !== "staff";
  patientField.hidden = role !== "patient";
  licenseInput.required = role === "doctor";
  staffInput.required = role === "staff";
  patientInput.required = role === "patient";

  if (role !== "doctor") {
    licenseInput.value = "";
  }

  if (role !== "staff") {
    staffInput.value = "";
  }

  if (role !== "patient") {
    patientInput.value = "";
  }
};

const loadAccounts = async () => {
  const table = document.getElementById("accountTable");

  if (!table) {
    return;
  }

  const users = await apiRequest("/users");

  table.innerHTML = users.length
    ? users.map((user) => `
      <tr>
        <td>${escapeHtml(user.username)}</td>
        <td>${escapeHtml(user.email || "")}</td>
        <td><span class="badge">${escapeHtml(user.role)}</span></td>
        <td>${escapeHtml(user.role === "doctor" ? user.licenseId || "" : user.role === "staff" ? user.staffId || "" : user.role === "patient" ? `Patient #${user.patientId || ""}` : "System Admin")}</td>
        <td>
          <div class="actions">
            <button class="small-button" data-edit-account="${user.id}">Edit</button>
            <button class="danger-button" data-delete-account="${user.id}">Delete</button>
          </div>
        </td>
      </tr>
    `).join("")
    : "<tr><td colspan=\"5\">No accounts found.</td></tr>";
};

const setupAccounts = () => {
  const form = document.getElementById("accountForm");

  if (!form) {
    return;
  }

  document.getElementById("accountPassword").required = true;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const id = document.getElementById("accountId").value;

    try {
      await apiRequest(id ? `/users/${id}` : "/users", {
        method: id ? "PUT" : "POST",
        body: JSON.stringify(accountPayload())
      });

      clearAccountForm();
      setMessage("accountMessage", "Account saved successfully.");
      await loadAccounts();
    } catch (error) {
      setMessage("accountMessage", error.message, true);
    }
  });

  document.getElementById("resetAccountForm").addEventListener("click", clearAccountForm);
  document.getElementById("accountRole").addEventListener("change", updateCredentialFields);
  updateCredentialFields();

  document.getElementById("accountTable").addEventListener("click", async (event) => {
    const editId = event.target.dataset.editAccount;
    const deleteId = event.target.dataset.deleteAccount;

    if (editId) {
      const users = await apiRequest("/users");
      const user = users.find((item) => String(item.id) === String(editId));

      document.getElementById("accountId").value = user.id;
      document.getElementById("accountUsername").value = user.username || "";
      document.getElementById("accountEmail").value = user.email || "";
      document.getElementById("accountRole").value = user.role || "staff";
      document.getElementById("licenseId").value = user.licenseId || "";
      document.getElementById("staffId").value = user.staffId || "";
      document.getElementById("accountPatientId").value = user.patientId || "";
      document.getElementById("accountPassword").value = "";
      document.getElementById("accountPassword").required = false;
      document.getElementById("accountFormTitle").textContent = "Edit Account";
      updateCredentialFields();
    }

    if (deleteId && confirm("Delete this account?")) {
      try {
        await apiRequest(`/users/${deleteId}`, { method: "DELETE" });
        await loadAccounts();
      } catch (error) {
        setMessage("accountMessage", error.message, true);
      }
    }
  });

  loadAccounts().catch((error) => setMessage("accountMessage", error.message, true));
};

const billingPayload = () => ({
  patientName: document.getElementById("billingPatientName").value,
  statementDate: document.getElementById("statementDate").value,
  serviceDescription: document.getElementById("serviceDescription").value,
  amount: document.getElementById("amount").value,
  philhealthId: document.getElementById("philhealthId").value,
  seniorCitizenId: document.getElementById("seniorCitizenId").value,
  pwdId: document.getElementById("pwdId").value,
  discountType: document.getElementById("discountType").value,
  paymentMethod: document.getElementById("paymentMethod").value,
  paymentStatus: document.getElementById("paymentStatus").value
});

const formatMoney = (value) => {
  return Number(value || 0).toLocaleString("en-PH", {
    style: "currency",
    currency: "PHP"
  });
};

const formatPaymentMethod = (value) => {
  const labels = {
    cash: "Cash Payment",
    online_banking: "Online Banking",
    ewallet: "E-Wallet"
  };

  return labels[value] || value;
};

const clearBillingForm = () => {
  document.getElementById("billingId").value = "";
  document.getElementById("billingForm").reset();
  document.getElementById("billingFormTitle").textContent = "Create Billing Statement";
};

const loadBillings = async () => {
  const table = document.getElementById("billingTable");

  if (!table) {
    return;
  }

  const billings = await apiRequest("/billings");

  table.innerHTML = billings.length
    ? billings.map((billing) => `
      <tr>
        <td>${escapeHtml(billing.patientName)}<br><small>${escapeHtml(billing.statementDate || "")}</small></td>
        <td>${escapeHtml(billing.serviceDescription || "")}</td>
        <td>${formatMoney(billing.amount)}</td>
        <td>
          <span class="badge">${escapeHtml(billing.discountType)}</span><br>
          <small>${formatMoney(billing.discountAmount)}</small>
        </td>
        <td>${formatMoney(billing.totalAmount)}</td>
        <td>
          ${escapeHtml(formatPaymentMethod(billing.paymentMethod))}<br>
          <span class="badge">${escapeHtml(billing.paymentStatus)}</span>
        </td>
        <td>
          <div class="actions">
            ${["admin", "staff"].includes(currentUser?.role)
              ? `<button class="small-button" data-edit-billing="${billing.id}">Edit</button>`
              : ""}
            ${currentUser?.role === "admin"
              ? `<button class="danger-button" data-delete-billing="${billing.id}">Delete</button>`
              : ""}
          </div>
        </td>
      </tr>
    `).join("")
    : "<tr><td colspan=\"7\">No billing statements found.</td></tr>";
};

const setupBillings = () => {
  const form = document.getElementById("billingForm");

  if (!form) {
    return;
  }

  if (!["admin", "staff"].includes(currentUser?.role)) {
    form.closest(".panel").hidden = true;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const id = document.getElementById("billingId").value;

    try {
      await apiRequest(id ? `/billings/${id}` : "/billings", {
        method: id ? "PUT" : "POST",
        body: JSON.stringify(billingPayload())
      });

      clearBillingForm();
      setMessage("billingMessage", "Billing statement saved successfully.");
      await loadBillings();
    } catch (error) {
      setMessage("billingMessage", error.message, true);
    }
  });

  document.getElementById("resetBillingForm").addEventListener("click", clearBillingForm);

  document.getElementById("billingTable").addEventListener("click", async (event) => {
    const editId = event.target.dataset.editBilling;
    const deleteId = event.target.dataset.deleteBilling;

    if (editId) {
      const billings = await apiRequest("/billings");
      const billing = billings.find((item) => String(item.id) === String(editId));

      document.getElementById("billingId").value = billing.id;
      document.getElementById("billingPatientName").value = billing.patientName || "";
      document.getElementById("statementDate").value = billing.statementDate || "";
      document.getElementById("serviceDescription").value = billing.serviceDescription || "";
      document.getElementById("amount").value = billing.amount || "";
      document.getElementById("philhealthId").value = billing.philhealthId || "";
      document.getElementById("seniorCitizenId").value = billing.seniorCitizenId || "";
      document.getElementById("pwdId").value = billing.pwdId || "";
      document.getElementById("discountType").value = billing.discountType || "none";
      document.getElementById("paymentMethod").value = billing.paymentMethod || "cash";
      document.getElementById("paymentStatus").value = billing.paymentStatus || "unpaid";
      document.getElementById("billingFormTitle").textContent = "Edit Billing Statement";
    }

    if (deleteId && confirm("Delete this billing statement?")) {
      try {
        await apiRequest(`/billings/${deleteId}`, { method: "DELETE" });
        await loadBillings();
      } catch (error) {
        setMessage("billingMessage", error.message, true);
      }
    }
  });

  loadBillings().catch((error) => setMessage("billingMessage", error.message, true));
};

requireAuth();
applyRoleUi();
setupLogin();
setupLogout();
loadDashboard();
setupPatients();
setupAppointments();
setupAccounts();
setupBillings();
