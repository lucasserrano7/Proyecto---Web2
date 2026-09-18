document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("modal-guardar-coleccion");
  const btnCerrar = document.getElementById("btn-cerrar-modal-guardar");
  const btnListo = document.getElementById("btn-listo-modal-guardar");
  const contenedorLista = document.getElementById("lista-colecciones-guardar");

  let publicacionActualId = null;
  let botonTarjetaActual = null;

  const cerrarModal = () => {
    if (modal) {
      modal.classList.add("hidden");
      modal.classList.remove("flex");
    }
    publicacionActualId = null;
    botonTarjetaActual = null;
  };

  if (btnCerrar) btnCerrar.addEventListener("click", cerrarModal);
  if (btnListo) btnListo.addEventListener("click", cerrarModal);

  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) cerrarModal();
    });
  }

  document.addEventListener("click", async (e) => {
    const btnBookmark = e.target.closest(".btn-guardar-coleccion");
    if (!btnBookmark) return;

    e.preventDefault();
    publicacionActualId = btnBookmark.dataset.publiId;
    botonTarjetaActual = btnBookmark;

    if (!publicacionActualId) return;

    contenedorLista.innerHTML = `
      <div class="py-8 text-center text-gray-400 flex flex-col items-center gap-2">
        <i class="fa-solid fa-circle-notch fa-spin text-2xl text-blue-600"></i>
        <span class="text-xs font-semibold">Cargando tus colecciones...</span>
      </div>
    `;
    modal.classList.remove("hidden");
    modal.classList.add("flex");

    try {
      const res = await fetch(`/colecciones/para-guardar/${publicacionActualId}`, {
        credentials: "same-origin",
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        cerrarModal();
        if (window.mostrarAlerta) {
          mostrarAlerta(data.message || "Iniciá sesión para guardar fotos.", "warning");
        }
        return;
      }

      if (data.colecciones.length === 0) {
        contenedorLista.innerHTML = `
          <div class="py-6 text-center text-gray-500">
            <i class="fa-solid fa-folder-open text-3xl mb-2 text-gray-400"></i>
            <p class="text-xs font-bold text-gray-700">No tenés colecciones creadas</p>
            <p class="text-[11px] text-gray-500 mt-0.5">Creá una para organizar tus fotos guardadas.</p>
          </div>
        `;
        return;
      }

      contenedorLista.innerHTML = "";
      data.colecciones.forEach((col) => {
        const item = document.createElement("div");
        item.className =
          "flex items-center justify-between p-2.5 rounded-2xl bg-white/70 border border-gray-200/80 shadow-xs hover:bg-white transition-all";

        item.innerHTML = `
          <div class="flex flex-col truncate pr-2">
            <span class="text-xs font-black text-blue-950 truncate">${col.titulo}</span>
            <span class="text-[10px] text-gray-500 font-bold uppercase">${col.categoria}</span>
          </div>
          <button 
            type="button" 
            class="btn-toggle-col shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer ${
              col.guardada
                ? "bg-emerald-500 text-white shadow-xs"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
            }" 
            data-col-id="${col.id}"
            data-guardada="${col.guardada ? "true" : "false"}"
          >
            <i class="fa-solid ${col.guardada ? "fa-check" : "fa-plus"} text-[10px]"></i>
            <span>${col.guardada ? "Guardada" : "Guardar"}</span>
          </button>
        `;
        contenedorLista.appendChild(item);
      });
    } catch (err) {
      console.error(err);
      contenedorLista.innerHTML = `
        <div class="py-4 text-center text-red-500 text-xs font-bold">
          Error al cargar colecciones.
        </div>
      `;
    }
  });


  if (contenedorLista) {
    contenedorLista.addEventListener("click", async (e) => {
      const btnToggle = e.target.closest(".btn-toggle-col");
      if (!btnToggle || !publicacionActualId) return;

      const coleccionId = btnToggle.dataset.colId;
      btnToggle.disabled = true;

      try {
        const res = await fetch("/colecciones/toggle-publicacion", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          credentials: "same-origin",
          body: JSON.stringify({
            coleccionId,
            publicacionId: publicacionActualId,
          }),
        });

        const data = await res.json();

        if (res.ok && data.success) {
          const spanTexto = btnToggle.querySelector("span");
          const icono = btnToggle.querySelector("i");

          const estaGuardado = data.guardada !== undefined ? data.guardada : data.agregado;

          if (estaGuardado) {
            btnToggle.className =
              "btn-toggle-col shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer bg-emerald-500 text-white shadow-xs";
            if (icono) icono.className = "fa-solid fa-check text-[10px]";
            if (spanTexto) spanTexto.textContent = "Guardada";
            btnToggle.dataset.guardada = "true";
          } else {
            btnToggle.className =
              "btn-toggle-col shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200";
            if (icono) icono.className = "fa-solid fa-plus text-[10px]";
            if (spanTexto) spanTexto.textContent = "Guardar";
            btnToggle.dataset.guardada = "false";
          }

          if (botonTarjetaActual) {
            const iconoTarjeta = botonTarjetaActual.querySelector("i");
            const algunaColeccionTieneLaFoto = Array.from(
              contenedorLista.querySelectorAll(".btn-toggle-col")
            ).some((b) => b.dataset.guardada === "true");

            if (iconoTarjeta) {
              if (algunaColeccionTieneLaFoto) {
                iconoTarjeta.classList.remove("fa-regular");
                iconoTarjeta.classList.add("fa-solid");
              } else {
                iconoTarjeta.classList.remove("fa-solid");
                iconoTarjeta.classList.add("fa-regular");
              }
            }
          }

          if (window.mostrarAlerta) {
            mostrarAlerta(data.message, estaGuardado ? "success" : "info");
          }
        } else {
          if (window.mostrarAlerta) {
            mostrarAlerta(data.message || "Error al actualizar", "warning");
          }
        }
      } catch (err) {
        console.error(err);
        if (window.mostrarAlerta) {
          mostrarAlerta("Error de conexión.", "error");
        }
      } finally {
        btnToggle.disabled = false;
      }
    });
  }
});