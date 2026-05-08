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
  age: document.getElementById("age").value || null,
  gender: document.getElementById("gender").value,
  diagnosis: document.getElementById("diagnosis").value,
  medications: document.getElementById("medications").value
});

const clearPatientForm = () => {
  document.getElementById("patientId").value = "";
  document.getElementById("patientForm").reset();
  document.getElementById("patientFormTitle").textContent = "Add Patient";
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
        <td>${escapeHtml(patient.age || "")}</td>
        <td>${escapeHtml(patient.gender || "")}</td>
        <td>${escapeHtml(patient.diagnosis || "")}</td>
        <td>${escapeHtml(patient.medications || "")}</td>
        <td>
          <div class="actions">
            <button class="small-button" data-edit-patient="${patient.id}">Edit</button>
            <button class="danger-button" data-delete-patient="${patient.id}">Delete</button>
          </div>
        </td>
      </tr>
    `).join("")
    : "<tr><td colspan=\"6\">No patients found.</td></tr>";
};

const setupPatients = () => {
  const form = document.getElementById("patientForm");

  if (!form) {
    return;
  }

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
      document.getElementById("age").value = patient.age || "";
      document.getElementById("gender").value = patient.gender || "";
      document.getElementById("diagnosis").value = patient.diagnosis || "";
      document.getElementById("medications").value = patient.medications || "";
      document.getElementById("patientFormTitle").textContent = "Edit Patient";
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
            <button class="small-button" data-edit-appointment="${appointment.id}">Edit</button>
            <button class="danger-button" data-cancel-appointment="${appointment.id}">Cancel</button>
            <button class="danger-button" data-delete-appointment="${appointment.id}">Delete</button>
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

requireAuth();
setupLogin();
setupLogout();
loadDashboard();
setupPatients();
setupAppointments();
