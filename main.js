import { submitContactForm } from "./contactForm.js";

document.body.classList.add("js");

const header = document.querySelector(".site-header");
const navToggle = document.querySelector("[data-nav-toggle]");
const navMenu = document.querySelector("[data-nav]");

const updateHeaderShadow = () => {
  if (!header) return;
  header.classList.toggle("is-scrolled", window.scrollY > 8);
};

updateHeaderShadow();
window.addEventListener("scroll", updateHeaderShadow, { passive: true });

if (navToggle && navMenu) {
  navToggle.addEventListener("click", () => {
    const isOpen = navMenu.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  navMenu.addEventListener("click", (event) => {
    if (event.target instanceof HTMLAnchorElement) {
      navMenu.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
    }
  });
}

const form = document.querySelector("#contact-form");

if (form) {
  const statusEl = form.querySelector("[data-form-status]");
  const submitButton = form.querySelector("button[type=submit]");

  const fields = {
    name: {
      input: form.elements.namedItem("name"),
      error: form.querySelector("#error-name"),
      label: "Name",
      required: true,
    },
    email: {
      input: form.elements.namedItem("email"),
      error: form.querySelector("#error-email"),
      label: "Email",
      required: true,
    },
    company: {
      input: form.elements.namedItem("company"),
      error: form.querySelector("#error-company"),
      label: "Company",
      required: false,
    },
    projectType: {
      input: form.elements.namedItem("projectType"),
      error: form.querySelector("#error-projectType"),
      label: "Project Type",
      required: true,
    },
    budget: {
      input: form.elements.namedItem("budget"),
      error: form.querySelector("#error-budget"),
      label: "Budget",
      required: false,
    },
    message: {
      input: form.elements.namedItem("message"),
      error: form.querySelector("#error-message"),
      label: "Project Details",
      required: true,
    },
  };

  const emailPattern = /^(?!\s)[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const setStatus = (state, message) => {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.classList.remove("is-success", "is-error", "is-sending");
    if (state) {
      statusEl.classList.add(state);
    }
  };

  const setError = (key, message) => {
    const field = fields[key];
    if (!field) return false;
    if (field.error) {
      field.error.textContent = message;
    }
    if (field.input) {
      field.input.setAttribute("aria-invalid", "true");
    }
    return false;
  };

  const clearError = (key) => {
    const field = fields[key];
    if (!field) return;
    if (field.error) {
      field.error.textContent = "";
    }
    if (field.input) {
      field.input.removeAttribute("aria-invalid");
    }
  };

  const validateField = (key) => {
    const field = fields[key];
    if (!field || !field.input) return true;

    const value = String(field.input.value || "").trim();

    if (field.required && !value) {
      return setError(key, `Please enter your ${field.label.toLowerCase()}.`);
    }

    if (key === "email" && value && !emailPattern.test(value)) {
      return setError(key, "Please enter a valid email address.");
    }

    clearError(key);
    return true;
  };

  Object.keys(fields).forEach((key) => {
    const field = fields[key];
    if (!field.input) return;

    field.input.addEventListener("blur", () => validateField(key));
    field.input.addEventListener("input", () => {
      if (field.input.getAttribute("aria-invalid") === "true") {
        validateField(key);
      }
    });
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    setStatus(null, "");

    const validations = Object.keys(fields).map((key) => validateField(key));
    const isValid = validations.every(Boolean);

    if (!isValid) {
      setStatus("is-error", "Please fix the highlighted fields and try again.");
      return;
    }

    const formData = {
      name: String(fields.name.input?.value || "").trim(),
      email: String(fields.email.input?.value || "").trim(),
      company: String(fields.company.input?.value || "").trim(),
      projectType: String(fields.projectType.input?.value || "").trim(),
      budget: String(fields.budget.input?.value || "").trim(),
      message: String(fields.message.input?.value || "").trim(),
    };

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.dataset.originalText = submitButton.textContent || "";
      submitButton.textContent = "Sending...";
    }

    setStatus("is-sending", "Sending your message...");

    try {
      await submitContactForm(formData);
      setStatus("is-success", "Message sent! We’ll be in touch soon.");
      form.reset();
      Object.keys(fields).forEach((key) => clearError(key));
    } catch (error) {
      setStatus(
        "is-error",
        "There was an error sending your message. Please try again."
      );
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = submitButton.dataset.originalText || "Send Message";
      }
    }
  });
}
