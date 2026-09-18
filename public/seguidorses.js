document.addEventListener("click", async (e) => {
  const btnFollow = e.target.closest(".seguir-btn");
  if (!btnFollow) return;

  e.preventDefault();
  const creatorId = btnFollow.dataset.creatorId;

  if (!creatorId) return;

  btnFollow.disabled = true;

  try {
    const response = await fetch("/seguidores/seguir", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "same-origin",
      body: JSON.stringify({ creatorId }),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      const contadorSeguidores = document.getElementById("contador-seguidores");
      let totalActual = contadorSeguidores ? parseInt(contadorSeguidores.textContent) || 0 : 0;

      if (result.siguiendo) {
        btnFollow.className =
          "seguir-btn bg-emerald-500/80 hover:bg-emerald-600 border border-white/50 text-white font-bold py-2 px-5 rounded-2xl transition-all shadow-md active:scale-95 cursor-pointer text-sm flex items-center gap-2";
        btnFollow.innerHTML = `<i class="fa-solid fa-user-check text-xs"></i><span>Siguiendo</span>`;
        if (contadorSeguidores) contadorSeguidores.textContent = totalActual + 1;
      } else {
        btnFollow.className =
          "seguir-btn bg-white/20 hover:bg-white/30 border border-white/40 text-white font-bold py-2 px-5 rounded-2xl transition-all shadow-md active:scale-95 cursor-pointer text-sm flex items-center gap-2";
        btnFollow.innerHTML = `<i class="fa-solid fa-user-plus text-xs"></i><span>Seguir</span>`;
        if (contadorSeguidores) contadorSeguidores.textContent = Math.max(0, totalActual - 1);
      }

      if (window.mostrarAlerta && result.message) {
        mostrarAlerta(result.message, result.siguiendo ? "success" : "info");
      }
    } else {
      console.error("Error en la respuesta del servidor:", result.message);
      if (window.mostrarAlerta && result.message) {
        mostrarAlerta(result.message, "warning");
      }
    }
  } catch (error) {
    console.error("Error al enviar la solicitud de seguimiento:", error);
    if (window.mostrarAlerta) {
      mostrarAlerta("Error de conexión al intentar seguir.", "error");
    }
  } finally {
    btnFollow.disabled = false;
  }
});