export function submitContactForm(formData) {
  return fetch("https://vsventurescontactemail-au5sxttunq-uc.a.run.app", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(formData),
  }).then(async (response) => {
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error || "Request failed");
    }
    return response.json().catch(() => ({ ok: true }));
  });
}
