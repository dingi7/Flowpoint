(function () {
  "use strict";

  // Default API base URL - can be overridden via config
  const DEFAULT_API_BASE_URL =
    "https://us-central1-brogrammers-crm.cloudfunctions.net";

  // Inline CSS for styling
  const STYLES = `
    .flowpoint-form-container {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background: #fff;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    .flowpoint-form-group {
      margin-bottom: 20px;
    }
    .flowpoint-form-label {
      display: block;
      margin-bottom: 6px;
      font-weight: 500;
      color: #333;
      font-size: 14px;
    }
    .flowpoint-form-label .required {
      color: #dc2626;
      margin-left: 2px;
    }
    .flowpoint-form-input,
    .flowpoint-form-select,
    .flowpoint-form-textarea {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 14px;
      box-sizing: border-box;
      transition: border-color 0.2s;
    }
    .flowpoint-form-input:focus,
    .flowpoint-form-select:focus,
    .flowpoint-form-textarea:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
    .flowpoint-form-textarea {
      min-height: 80px;
      resize: vertical;
    }
    .flowpoint-form-button {
      width: 100%;
      padding: 12px 24px;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 16px;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.2s;
    }
    .flowpoint-form-button:hover:not(:disabled) {
      background: #2563eb;
    }
    .flowpoint-form-button:disabled {
      background: #9ca3af;
      cursor: not-allowed;
    }
    .flowpoint-loading {
      text-align: center;
      padding: 20px;
      color: #6b7280;
    }
    .flowpoint-error {
      padding: 12px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 6px;
      color: #dc2626;
      margin-bottom: 20px;
      font-size: 14px;
    }
    .flowpoint-success {
      padding: 12px;
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 6px;
      color: #16a34a;
      margin-bottom: 20px;
      font-size: 14px;
    }
    .flowpoint-timeslot-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
      gap: 8px;
      margin-top: 8px;
    }
    .flowpoint-timeslot-button {
      padding: 8px 12px;
      border: 1px solid #d1d5db;
      background: white;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.2s;
    }
    .flowpoint-timeslot-button:hover:not(:disabled) {
      border-color: #3b82f6;
      background: #eff6ff;
    }
    .flowpoint-timeslot-button.selected {
      background: #3b82f6;
      color: white;
      border-color: #3b82f6;
    }
    .flowpoint-timeslot-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    @media (max-width: 640px) {
      .flowpoint-form-container {
        padding: 16px;
      }
      .flowpoint-timeslot-grid {
        grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
      }
    }
  `;

  // Inject styles
  function injectStyles() {
    if (document.getElementById("flowpoint-sdk-styles")) return;
    const style = document.createElement("style");
    style.id = "flowpoint-sdk-styles";
    style.textContent = STYLES;
    document.head.appendChild(style);
  }

  // API client
  function createApiClient(baseUrl) {
    return {
      async getServices(organizationId) {
        const response = await fetch(
          `${baseUrl}/widgetGetOrganizationServices?organizationId=${encodeURIComponent(
            organizationId
          )}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch services");
        }
        const data = await response.json();
        if (!data.success) {
          throw new Error(data.error || "Failed to fetch services");
        }
        return data.services || [];
      },

      async getMembers(organizationId) {
        const response = await fetch(
          `${baseUrl}/widgetGetOrganizationMembers?organizationId=${encodeURIComponent(
            organizationId
          )}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch members");
        }
        const data = await response.json();
        if (!data.success) {
          throw new Error(data.error || "Failed to fetch members");
        }
        return data.members || [];
      },

      async getAvailableTimeslots(organizationId, serviceId, assigneeId, date) {
        const response = await fetch(`${baseUrl}/widgetGetAvailableTimeslots`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            organizationId,
            serviceId,
            assigneeId,
            date: date.toISOString().split("T")[0],
          }),
        });
        if (!response.ok) {
          throw new Error("Failed to fetch available timeslots");
        }
        const data = await response.json();
        if (!data.success) {
          throw new Error(data.error || "Failed to fetch available timeslots");
        }
        return data.timeslots || [];
      },

      async bookAppointment(payload) {
        const response = await fetch(`${baseUrl}/widgetBookAppointment`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.error || "Failed to book appointment");
        }
        return data;
      },
    };
  }

  // Format time slot
  function formatTimeSlot(timeslot) {
    const start = new Date(timeslot.start);
    const hours = start.getHours();
    const minutes = start.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, "0");
    return `${displayHours}:${displayMinutes} ${ampm}`;
  }

  // Format date for display
  function formatDate(date) {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  // Validate email
  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // Main form renderer
  function renderForm(config) {
    const { organizationId, target, apiBaseUrl } = config;

    if (!organizationId) {
      throw new Error("organizationId is required");
    }

    const targetElement =
      typeof target === "string" ? document.querySelector(target) : target;

    if (!targetElement) {
      throw new Error("Target element not found");
    }

    injectStyles();

    const baseUrl = apiBaseUrl || DEFAULT_API_BASE_URL;
    const api = createApiClient(baseUrl);

    let services = [];
    let members = [];
    let selectedService = null;
    let selectedAssignee = null;
    let selectedDate = null;
    let selectedTimeslot = null;
    let availableTimeslots = [];
    let isLoading = false;
    let error = null;
    let success = null;

    // State management
    function setState(updates) {
      if (updates.isLoading !== undefined) isLoading = updates.isLoading;
      if (updates.error !== undefined) error = updates.error;
      if (updates.success !== undefined) success = updates.success;
      if (updates.selectedService !== undefined)
        selectedService = updates.selectedService;
      if (updates.selectedDate !== undefined)
        selectedDate = updates.selectedDate;
      if (updates.selectedTimeslot !== undefined)
        selectedTimeslot = updates.selectedTimeslot;
      if (updates.availableTimeslots !== undefined)
        availableTimeslots = updates.availableTimeslots;
      if (updates.services !== undefined) services = updates.services;
      if (updates.members !== undefined) members = updates.members;
      render();
    }

    // Load initial data
    async function loadData() {
      try {
        setState({ isLoading: true, error: null });
        const [loadedServices, loadedMembers] = await Promise.all([
          api.getServices(organizationId),
          api.getMembers(organizationId),
        ]);
        setState({
          isLoading: false,
          services: loadedServices,
          members: loadedMembers,
        });
      } catch (err) {
        setState({
          isLoading: false,
          error: err.message || "Failed to load data. Please try again later.",
        });
      }
    }

    // Load timeslots when service, assignee and date are selected
    async function loadTimeslots() {
      if (!selectedService || !selectedAssignee || !selectedDate) {
        setState({ availableTimeslots: [] });
        return;
      }

      try {
        setState({ isLoading: true, error: null });
        const timeslots = await api.getAvailableTimeslots(
          organizationId,
          selectedService.id,
          selectedAssignee.id,
          selectedDate
        );
        setState({
          isLoading: false,
          selectedTimeslot: null,
          availableTimeslots: timeslots,
        });
      } catch (err) {
        setState({
          isLoading: false,
          error: err.message || "Failed to load available timeslots",
        });
      }
    }

    // Get available assignees for selected service
    function getAvailableAssignees() {
      return members;
    }

    // Handle form submission
    async function handleSubmit(e) {
      e.preventDefault();

      const formData = new FormData(e.target);
      const customerName = formData.get("customerName");
      const customerEmail = formData.get("customerEmail");
      const customerPhone = formData.get("customerPhone");
      const customerAddress = formData.get("customerAddress") || "";
      const customerNotes = formData.get("customerNotes") || "";

      // Validation
      if (!customerName || !customerEmail || !customerPhone) {
        setState({ error: "Please fill in all required fields" });
        return;
      }

      if (!isValidEmail(customerEmail)) {
        setState({ error: "Please enter a valid email address" });
        return;
      }

      if (!selectedService) {
        setState({ error: "Please select a service" });
        return;
      }

      if (!selectedAssignee) {
        setState({ error: "Please select an assignee" });
        return;
      }

      if (!selectedDate) {
        setState({ error: "Please select a date" });
        return;
      }

      if (!selectedTimeslot) {
        setState({ error: "Please select a time slot" });
        return;
      }

      const assigneeId = selectedAssignee.id;

      // Combine date and time
      const startTime = new Date(selectedDate);
      const [hours, minutes] = selectedTimeslot.start.split(":").map(Number);
      startTime.setHours(hours, minutes, 0, 0);

      try {
        setState({ isLoading: true, error: null, success: null });

        await api.bookAppointment({
          organizationId,
          serviceId: selectedService.id,
          assigneeId,
          customerEmail,
          customerData: {
            name: customerName,
            phone: customerPhone,
            address: customerAddress,
            notes: customerNotes,
          },
          startTime: startTime.toISOString(),
          title: selectedService.name,
          description: selectedService.description || "",
        });

        // Reset form
        e.target.reset();

        setState({
          isLoading: false,
          success:
            "Appointment booked successfully! You will receive a confirmation email shortly.",
          error: null,
          selectedService: null,
          selectedAssignee: null,
          selectedDate: null,
          selectedTimeslot: null,
          availableTimeslots: [],
        });

        // Clear success message after 5 seconds
        setTimeout(() => {
          setState({ success: null });
        }, 5000);
      } catch (err) {
        setState({
          isLoading: false,
          error: err.message || "Failed to book appointment. Please try again.",
        });
      }
    }

    // Render function
    function render() {
      const html = `
        <div class="flowpoint-form-container">
          ${error ? `<div class="flowpoint-error">${error}</div>` : ""}
          ${success ? `<div class="flowpoint-success">${success}</div>` : ""}
          
          ${
            isLoading && !selectedService
              ? '<div class="flowpoint-loading">Loading...</div>'
              : `<form onsubmit="return false;" id="flowpoint-booking-form">
              <div class="flowpoint-form-group">
                <label class="flowpoint-form-label">
                  Service <span class="required">*</span>
                </label>
                <select 
                  class="flowpoint-form-select" 
                  name="serviceId" 
                  required
                  ${isLoading ? "disabled" : ""}
                >
                  <option value="">Select a service</option>
                  ${services
                    .map(
                      (service) => `
                    <option value="${service.id}" data-owner-id="${
                        service.ownerId
                      }" ${selectedService && selectedService.id === service.id ? "selected" : ""}>
                      ${service.name}${
                        service.price > 0
                          ? ` - $${service.price.toFixed(2)}`
                          : ""
                      }
                    </option>
                  `
                    )
                    .join("")}
                </select>
              </div>

              ${
                selectedService
                  ? `<div class="flowpoint-form-group">
                  <label class="flowpoint-form-label">
                    Assignee <span class="required">*</span>
                  </label>
                  <select 
                    class="flowpoint-form-select" 
                    name="assigneeId" 
                    required
                    ${isLoading ? "disabled" : ""}
                  >
                    <option value="">Select an assignee</option>
                    ${getAvailableAssignees()
                      .map(
                        (member) => `
                      <option value="${member.id}" ${
                          selectedAssignee && selectedAssignee.id === member.id
                            ? "selected"
                            : ""
                        }>
                        ${member.name}
                      </option>
                    `
                      )
                      .join("")}
                  </select>
                </div>`
                  : ""
              }

              <div class="flowpoint-form-group">
                <label class="flowpoint-form-label">
                  Date <span class="required">*</span>
                </label>
                <input 
                  type="date" 
                  class="flowpoint-form-input" 
                  name="appointmentDate" 
                  required
                  min="${new Date().toISOString().split("T")[0]}"
                  value="${selectedDate ? selectedDate.toISOString().split("T")[0] : ""}"
                  ${isLoading ? "disabled" : ""}
                />
              </div>

              ${
                selectedService &&
                selectedAssignee &&
                selectedDate &&
                availableTimeslots.length > 0
                  ? `<div class="flowpoint-form-group">
                  <label class="flowpoint-form-label">
                    Time Slot <span class="required">*</span>
                  </label>
                  <div class="flowpoint-timeslot-grid">
                    ${availableTimeslots
                      .map(
                        (timeslot) => `
                      <button 
                        type="button"
                        class="flowpoint-timeslot-button ${
                          selectedTimeslot &&
                          selectedTimeslot.start === timeslot.start
                            ? "selected"
                            : ""
                        }"
                        data-start="${timeslot.start}"
                        ${isLoading ? "disabled" : ""}
                      >
                        ${formatTimeSlot(timeslot)}
                      </button>
                    `
                      )
                      .join("")}
                  </div>
                </div>`
                  : selectedService &&
                    selectedAssignee &&
                    selectedDate &&
                    !isLoading
                  ? '<div class="flowpoint-error" style="margin-top: 8px;">No available time slots for this date</div>'
                  : ""
              }

              <div class="flowpoint-form-group">
                <label class="flowpoint-form-label">
                  Name <span class="required">*</span>
                </label>
                <input 
                  type="text" 
                  class="flowpoint-form-input" 
                  name="customerName" 
                  required
                  ${isLoading ? "disabled" : ""}
                />
              </div>

              <div class="flowpoint-form-group">
                <label class="flowpoint-form-label">
                  Email <span class="required">*</span>
                </label>
                <input 
                  type="email" 
                  class="flowpoint-form-input" 
                  name="customerEmail" 
                  required
                  ${isLoading ? "disabled" : ""}
                />
              </div>

              <div class="flowpoint-form-group">
                <label class="flowpoint-form-label">
                  Phone <span class="required">*</span>
                </label>
                <input 
                  type="tel" 
                  class="flowpoint-form-input" 
                  name="customerPhone" 
                  required
                  ${isLoading ? "disabled" : ""}
                />
              </div>

              <div class="flowpoint-form-group">
                <label class="flowpoint-form-label">Address</label>
                <input 
                  type="text" 
                  class="flowpoint-form-input" 
                  name="customerAddress"
                  ${isLoading ? "disabled" : ""}
                />
              </div>

              <div class="flowpoint-form-group">
                <label class="flowpoint-form-label">Notes</label>
                <textarea 
                  class="flowpoint-form-textarea" 
                  name="customerNotes"
                  ${isLoading ? "disabled" : ""}
                ></textarea>
              </div>

              <button 
                type="submit" 
                class="flowpoint-form-button"
                ${isLoading ? "disabled" : ""}
              >
                ${isLoading ? "Booking..." : "Book Appointment"}
              </button>
            </form>`
          }
        </div>
      `;

      targetElement.innerHTML = html;

      // Attach event listeners
      const form = targetElement.querySelector("#flowpoint-booking-form");
      if (form) {
        form.addEventListener("submit", handleSubmit);

        // Service change handler
        const serviceSelect = form.querySelector('select[name="serviceId"]');
        if (serviceSelect) {
          serviceSelect.addEventListener("change", (e) => {
            const option = e.target.options[e.target.selectedIndex];
            if (option.value) {
              const service = services.find((s) => s.id === option.value);
              setState({
                selectedService: service,
                selectedAssignee: null, // Reset assignee when service changes
                selectedTimeslot: null,
                availableTimeslots: [],
              });
            } else {
              setState({
                selectedService: null,
                selectedAssignee: null,
                availableTimeslots: [],
              });
            }
          });
        }

        // Assignee change handler
        const assigneeSelect = form.querySelector('select[name="assigneeId"]');
        if (assigneeSelect) {
          // Store the current value before attaching listener to prevent re-render issues
          const currentValue = assigneeSelect.value;
          if (currentValue && !selectedAssignee) {
            // If there's a value but no selectedAssignee, restore it
            const assignee = members.find((m) => m.id === currentValue);
            if (assignee) {
              selectedAssignee = assignee;
            }
          }
          
          assigneeSelect.addEventListener("change", (e) => {
            e.preventDefault();
            e.stopPropagation();
            const option = e.target.options[e.target.selectedIndex];
            if (option.value) {
              const assignee = members.find((m) => m.id === option.value);
              if (!assignee) return;
              
              const currentDate = selectedDate; // Capture current date before state update
              setState({
                selectedAssignee: assignee,
                selectedTimeslot: null,
              });
              // Use captured date to check if we should load timeslots
              if (currentDate) {
                // Use setTimeout to ensure state is updated before calling loadTimeslots
                setTimeout(() => {
                  loadTimeslots();
                }, 0);
              }
            } else {
              setState({
                selectedAssignee: null,
                availableTimeslots: [],
              });
            }
          });
        }

        // Date change handler
        const dateInput = form.querySelector('input[name="appointmentDate"]');
        if (dateInput) {
          dateInput.addEventListener("change", (e) => {
            const date = new Date(e.target.value);
            const currentAssignee = selectedAssignee; // Capture current assignee before state update
            setState({
              selectedDate: date,
              selectedTimeslot: null,
            });
            // Use captured assignee to check if we should load timeslots
            if (currentAssignee) {
              // Use setTimeout to ensure state is updated before calling loadTimeslots
              setTimeout(() => {
                loadTimeslots();
              }, 0);
            }
          });
        }

        // Timeslot button handlers
        const timeslotButtons = form.querySelectorAll(
          ".flowpoint-timeslot-button"
        );
        timeslotButtons.forEach((button) => {
          button.addEventListener("click", (e) => {
            e.preventDefault();
            const start = e.target.getAttribute("data-start");
            const timeslot = availableTimeslots.find((t) => t.start === start);
            setState({ selectedTimeslot: timeslot });
          });
        });
      }
    }

    // Initial load
    loadData().then(() => {
      render();
    });
  }

  // Initialize Flowpoint namespace
  if (typeof window !== "undefined") {
    window.flowpoint = window.flowpoint || {};
    window.flowpoint.renderForm = renderForm;
  }
})();
