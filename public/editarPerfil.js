document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("modal-editar-perfil");
  const btnAbrir = document.getElementById("btn-abrir-editar");
  const btnCerrar = document.getElementById("btn-cerrar-editar");
  const form = document.getElementById("form-editar-perfil");
  const inputAvatar = document.getElementById("input-avatar");
  const previewImg = document.getElementById("preview-avatar");
  const previewPlaceholder = document.getElementById("preview-placeholder");

  if (!modal) return;

  btnAbrir?.addEventListener("click", () => {
    modal.classList.remove("hidden");
    modal.classList.add("flex");
  });

  const cerrarModal = () => {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  };

  btnCerrar?.addEventListener("click", cerrarModal);

  inputAvatar?.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      if (previewImg) {
        previewImg.src = url;
        previewImg.classList.remove("hidden");
      }
      if (previewPlaceholder) previewPlaceholder.classList.add("hidden");
    }
  });


  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(form);

    try {
      const res = await fetch("/user/editar", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (res.ok && data.success) {
        window.location.reload();
      } else {
        alert(data.message || "Error al actualizar el perfil");
      }
    } catch (err) {
      console.error("Error al guardar perfil:", err);
      alert("Error de conexión al guardar cambios.");
    }
  });
});