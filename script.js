document.addEventListener("DOMContentLoaded", () => {
  const STORAGE_KEY = "vehicleServiceRecords";

  const vehicleForm = document.getElementById("vehicleForm");
  const editVehicleForm = document.getElementById("editVehicleForm");
  const vehicleTableBody = document.getElementById("vehicleTableBody");
  const totalVehicles = document.getElementById("totalVehicles");
  const servicesDue = document.getElementById("servicesDue");
  const completedServices = document.getElementById("completedServices");
  const searchInput = document.getElementById("searchInput");
  const statusFilter = document.getElementById("statusFilter");
  const toast = document.getElementById("toast");
  const editModal = document.getElementById("editModal");
  const closeModalButton = document.getElementById("closeModal");
  const cancelEditButton = document.getElementById("cancelEdit");
  const navToggle = document.getElementById("navToggle");
  const navLinks = document.getElementById("navLinks");

  let vehicles = loadVehicles();
  let toastTimer = null;

  function loadVehicles() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error("Unable to load local storage data:", error);
      return [];
    }
  }

  function saveVehicles() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(vehicles));
    } catch (error) {
      console.error("Unable to save local storage data:", error);
      showToast("Unable to save data in local storage.");
    }
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");

    if (toastTimer) {
      clearTimeout(toastTimer);
    }

    toastTimer = setTimeout(() => {
      toast.classList.remove("show");
    }, 2500);
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function formatDate(dateString) {
    if (!dateString) {
      return "-";
    }

    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
      return dateString;
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  }

  function updateDashboard() {
    totalVehicles.textContent = vehicles.length;
    servicesDue.textContent = vehicles.filter((item) => item.status === "Pending").length;
    completedServices.textContent = vehicles.filter((item) => item.status === "Completed").length;
  }

  function getFilteredVehicles() {
    const searchValue = searchInput.value.trim().toLowerCase();
    const filterValue = statusFilter.value;

    return vehicles.filter((item) => {
      const matchesSearch =
        item.ownerName.toLowerCase().includes(searchValue) ||
        item.vehicleNumber.toLowerCase().includes(searchValue);

      const matchesStatus = filterValue === "all" || item.status === filterValue;

      return matchesSearch && matchesStatus;
    });
  }

  function renderVehicles() {
    const filteredVehicles = getFilteredVehicles();

    if (filteredVehicles.length === 0) {
      vehicleTableBody.innerHTML = `
        <tr>
          <td colspan="7" class="empty-row">No vehicle records found.</td>
        </tr>
      `;
      updateDashboard();
      return;
    }

    vehicleTableBody.innerHTML = filteredVehicles
      .map((item) => {
        const statusClass = item.status === "Completed" ? "status-completed" : "status-pending";

        return `
          <tr>
            <td>${escapeHtml(item.ownerName)}</td>
            <td>${escapeHtml(item.vehicleNumber)}</td>
            <td>${escapeHtml(item.vehicleType)}</td>
            <td>${formatDate(item.serviceDate)}</td>
            <td class="problem-text">${escapeHtml(item.problemDescription)}</td>
            <td><span class="status-pill ${statusClass}">${item.status}</span></td>
            <td>
              <div class="action-group">
                <button class="action-btn edit-btn" data-id="${item.id}" data-action="edit" type="button">Edit</button>
                <button class="action-btn toggle-btn" data-id="${item.id}" data-action="toggle" type="button">Toggle</button>
                <button class="action-btn delete-btn" data-id="${item.id}" data-action="delete" type="button">Delete</button>
              </div>
            </td>
          </tr>
        `;
      })
      .join("");

    updateDashboard();
  }

  function createVehicleFromForm() {
    return {
      id: Date.now().toString(),
      ownerName: document.getElementById("ownerName").value.trim(),
      vehicleNumber: document.getElementById("vehicleNumber").value.trim().toUpperCase(),
      vehicleType: document.getElementById("vehicleType").value,
      serviceDate: document.getElementById("serviceDate").value,
      problemDescription: document.getElementById("problemDescription").value.trim(),
      status: "Pending"
    };
  }

  function addVehicle(event) {
    event.preventDefault();

    const vehicle = createVehicleFromForm();
    vehicles.unshift(vehicle);
    saveVehicles();
    vehicleForm.reset();
    renderVehicles();
    showToast("Vehicle added successfully.");
  }

  function openEditModal(id) {
    const item = vehicles.find((vehicle) => vehicle.id === id);
    if (!item) {
      return;
    }

    document.getElementById("editVehicleId").value = item.id;
    document.getElementById("editOwnerName").value = item.ownerName;
    document.getElementById("editVehicleNumber").value = item.vehicleNumber;
    document.getElementById("editVehicleType").value = item.vehicleType;
    document.getElementById("editServiceDate").value = item.serviceDate;
    document.getElementById("editProblemDescription").value = item.problemDescription;

    editModal.classList.add("show");
  }

  function closeEditModal() {
    editModal.classList.remove("show");
  }

  function updateVehicle(event) {
    event.preventDefault();

    const id = document.getElementById("editVehicleId").value;
    const index = vehicles.findIndex((item) => item.id === id);

    if (index === -1) {
      return;
    }

    vehicles[index] = {
      ...vehicles[index],
      ownerName: document.getElementById("editOwnerName").value.trim(),
      vehicleNumber: document.getElementById("editVehicleNumber").value.trim().toUpperCase(),
      vehicleType: document.getElementById("editVehicleType").value,
      serviceDate: document.getElementById("editServiceDate").value,
      problemDescription: document.getElementById("editProblemDescription").value.trim()
    };

    saveVehicles();
    renderVehicles();
    closeEditModal();
    showToast("Vehicle updated successfully.");
  }

  function deleteVehicle(id) {
    const confirmed = window.confirm("Are you sure you want to delete this record?");
    if (!confirmed) {
      return;
    }

    vehicles = vehicles.filter((item) => item.id !== id);
    saveVehicles();
    renderVehicles();
    showToast("Vehicle deleted successfully.");
  }

  function toggleVehicleStatus(id) {
    vehicles = vehicles.map((item) => {
      if (item.id !== id) {
        return item;
      }

      return {
        ...item,
        status: item.status === "Pending" ? "Completed" : "Pending"
      };
    });

    saveVehicles();
    renderVehicles();
    showToast("Service status updated.");
  }

  function handleTableClick(event) {
    const button = event.target.closest("[data-action]");
    if (!button) {
      return;
    }

    const action = button.dataset.action;
    const id = button.dataset.id;

    if (action === "edit") {
      openEditModal(id);
    } else if (action === "toggle") {
      toggleVehicleStatus(id);
    } else if (action === "delete") {
      deleteVehicle(id);
    }
  }

  function closeModalOnBackdrop(event) {
    if (event.target === editModal) {
      closeEditModal();
    }
  }

  vehicleForm.addEventListener("submit", addVehicle);
  editVehicleForm.addEventListener("submit", updateVehicle);
  vehicleTableBody.addEventListener("click", handleTableClick);
  searchInput.addEventListener("input", renderVehicles);
  statusFilter.addEventListener("change", renderVehicles);
  closeModalButton.addEventListener("click", closeEditModal);
  cancelEditButton.addEventListener("click", closeEditModal);
  editModal.addEventListener("click", closeModalOnBackdrop);

  navToggle.addEventListener("click", () => {
    navLinks.classList.toggle("show");
  });

  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("show");
    });
  });

  renderVehicles();
});
