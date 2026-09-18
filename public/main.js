document.addEventListener("DOMContentLoaded", () => {
  const subir = document.getElementById("bg_subir");
  const btnAbrir = document.getElementById("btn_abrir");
  const btnCerrar = document.getElementById("btn_cerrar");

  if (btnAbrir && subir) {
    btnAbrir.addEventListener("click", () => {
      subir.classList.remove("hidden");
    });
  }
  if (btnCerrar && subir) {
    btnCerrar.addEventListener("click", () => {
      subir.classList.add("hidden");
    });
  }

  document.querySelectorAll(".form_comentario").forEach((form) => {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const inputTexto = form.querySelector('input[name="texto"]');
      const inputOculto = form.querySelector('input[name="ImagenId"]');
      const imagenId = inputOculto ? inputOculto.value : null;

      if (!inputTexto.value.trim()) {
        mostrarAlerta(
          "Escribí algo en el comentario antes de enviar.",
          "warning",
        );
        return;
      }
      if (!imagenId) return;

      try {
        const response = await fetch("/comentarios/new", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          credentials: "same-origin",
          body: JSON.stringify({
            ImagenId: imagenId,
            texto: inputTexto.value.trim(),
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const comentario = data.comentario;
          const lista = document.getElementById(
            `lista-comentarios-${imagenId}`,
          );

          if (lista) {
            const textosVacios = lista.querySelectorAll(".sin-comentarios, p");
            textosVacios.forEach((el) => {
              if (
                el.textContent.includes("Sin comentarios") ||
                el.textContent.includes("Sé el primero")
              ) {
                el.remove();
              }
            });

            const nuevoDiv = document.createElement("div");
            nuevoDiv.id = `comentario-${comentario.id}`;
            nuevoDiv.className =
              "p-2 border-b border-black/20 bg-white/40 rounded flex justify-between items-start gap-2";

            const username = comentario.Usuario?.username || "Tú";

            nuevoDiv.innerHTML = `
              <div class="flex-1">
                <p class="text-blue-500 font-semibold text-xs">@${username}</p>
                <span class="text-sm text-gray-800 break-words">${comentario.texto}</span>
              </div>
            `;
            lista.appendChild(nuevoDiv);
            lista.scrollTop = lista.scrollHeight;
          }

          inputTexto.value = "";
          mostrarAlerta("Comentario publicado.", "success");
        } else {
          const errData = await response.json();
          mostrarAlerta(
            errData.message || "Error al publicar el comentario.",
            "error",
          );
        }
      } catch (error) {
        console.error("Error al enviar comentario:", error);
        mostrarAlerta("Error de conexión al enviar el comentario.", "error");
      }
    });
  });

  const modalDenuncia = document.getElementById("modal-denuncia-comentario");
  const formDenuncia = document.getElementById("form-denunciar-comentario");
  const inputComentarioId = document.getElementById(
    "input-denuncia-comentario-id",
  );
  const selectMotivo = document.getElementById("select-motivo-denuncia");
  const textareaDesc = document.getElementById("textarea-desc-denuncia");
  const btnCancelar = document.getElementById("btn-cancelar-modal-comentario");

  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".btn-denunciar-comentario");
    if (!btn) return;

    if (inputComentarioId) inputComentarioId.value = btn.dataset.id;
    if (selectMotivo) selectMotivo.value = "";
    if (textareaDesc) textareaDesc.value = "";

    if (modalDenuncia) {
      modalDenuncia.classList.remove("hidden");
      modalDenuncia.classList.add("flex");
    }
  });

  if (btnCancelar && modalDenuncia) {
    btnCancelar.addEventListener("click", () => {
      modalDenuncia.classList.add("hidden");
      modalDenuncia.classList.remove("flex");
    });
  }

  if (formDenuncia) {
    formDenuncia.addEventListener("submit", async (e) => {
      e.preventDefault();

      const comentarioId = inputComentarioId.value;
      const motivo = selectMotivo.value;
      const description = textareaDesc.value.trim();

      if (!motivo)
        return mostrarAlerta("Por favor seleccioná un motivo.", "warning");

      try {
        const res = await fetch(`/comentarios/denunciar/${comentarioId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          credentials: "same-origin",
          body: JSON.stringify({ motivo, description }),
        });

        const data = await res.json();

        if (res.ok) {
          modalDenuncia.classList.add("hidden");
          modalDenuncia.classList.remove("flex");
          mostrarAlerta(
            "¡Denuncia enviada! Será revisada por moderación.",
            "success",
          );
        } else {
          mostrarAlerta(
            data.message || "No se pudo registrar la denuncia.",
            "error",
          );
        }
      } catch (err) {
        console.error("Error al enviar denuncia:", err);
        mostrarAlerta("Error de conexión al procesar la denuncia.", "error");
      }
    });
  }
});

const carruselImgs = {};

function cambiarFoto(publiId, dir) {
  const slider = document.getElementById(`slider-${publiId}`);
  if (!slider) return;

  const limite = slider.children.length;
  if (carruselImgs[publiId] === undefined) carruselImgs[publiId] = 0;

  carruselImgs[publiId] += dir;
  if (carruselImgs[publiId] >= limite) carruselImgs[publiId] = 0;
  if (carruselImgs[publiId] < 0) carruselImgs[publiId] = limite - 1;

  slider.style.transform = `translateX(-${carruselImgs[publiId] * 100}%)`;

  const slideActual = slider.children[carruselImgs[publiId]];
  const nuevaImagenId = slideActual.getAttribute("data-imgid");
  const nuevoPromedio = slideActual.getAttribute("data-promedio");
  const miVoto = parseInt(slideActual.getAttribute("data-votousuario")) || 0;

  const cajaEstrellas = document.getElementById(`caja-estrellas-${publiId}`);

  if (cajaEstrellas) {
    cajaEstrellas.setAttribute("data-id", nuevaImagenId);

    const estrellas = cajaEstrellas.querySelectorAll("i");
    estrellas.forEach((estrella, index) => {
      const num = index + 1;

      estrella.setAttribute(
        "onclick",
        `enviarValoracion('${nuevaImagenId}', ${num}, '${publiId}')`,
      );

      if (num <= miVoto) {
        estrella.classList.remove("fa-regular");
        estrella.classList.add("fa-solid");
      } else {
        estrella.classList.remove("fa-solid");
        estrella.classList.add("fa-regular");
      }
    });

    const spanPromedio = cajaEstrellas.querySelector(".promedio-span");
    if (spanPromedio) {
      spanPromedio.id = `promedio-${nuevaImagenId}`;
      spanPromedio.textContent = nuevoPromedio;
    }
  }

  const inputOculto = document.getElementById(`input-img-${publiId}`);
  if (inputOculto) inputOculto.value = nuevaImagenId;

  const contenedorPadre = document.getElementById(
    `contenedor-comentarios-${publiId}`,
  );
  if (contenedorPadre) {
    const todasLasListas = contenedorPadre.children;
    for (let i = 0; i < todasLasListas.length; i++) {
      todasLasListas[i].classList.add("hidden");
      todasLasListas[i].classList.remove("block");
    }
    const listaActual = document.getElementById(
      `lista-comentarios-${nuevaImagenId}`,
    );

    if (listaActual) {
      listaActual.classList.remove("hidden");
      listaActual.classList.add("block");
    }
  }
}

async function enviarValoracion(imagenId, puntaje, publiId) {
  try {
    const response = await fetch("/valoraciones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ puntaje: puntaje, imagenId: imagenId }),
    });

    const data = await response.json();
    if (response.ok) {
      const promedioElem = document.getElementById(`promedio-${imagenId}`);

      const contenedorEstrellas = document.querySelector(
        `.valoracion[data-id="${imagenId}"]`,
      );
      if (contenedorEstrellas) {
        const estrellas = contenedorEstrellas.querySelectorAll("i");
        estrellas.forEach((estrella, index) => {
          if (index < puntaje) {
            estrella.classList.remove("fa-regular");
            estrella.classList.add("fa-solid");
          } else {
            estrella.classList.remove("fa-solid");
            estrella.classList.add("fa-regular");
          }
        });
      }

      const imagenSlide = document.querySelector(
        `div[data-imgid="${imagenId}"]`,
      );
      if (imagenSlide) {
        imagenSlide.setAttribute("data-votousuario", puntaje);
        imagenSlide.setAttribute("data-promedio", data.promedio);
      }

      if (promedioElem) {
        promedioElem.textContent = `${data.promedio}`;
      }
      mostrarAlerta("¡Valoración enviada!", "success");
    }
  } catch (error) {
    console.error("Error al enviar la valoración:", error);
    mostrarAlerta("Error al enviar valoración.", "error");
  }
}

window.mostrarAlerta = (mensaje, tipo = "info") => {
  let c = document.getElementById("contenedor-alertas");
  if (!c) {
    c = document.createElement("div");
    c.id = "contenedor-alertas";
    c.className =
      "fixed top-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-3 w-full max-w-sm pointer-events-none px-4";
    document.body.appendChild(c);
  }

  const estilos = {
    error: {
      badge: "bg-red-500 text-white shadow-md shadow-red-500/40",
      icono: "fa-triangle-exclamation",
      titulo: "Atención",
    },
    success: {
      badge: "bg-emerald-500 text-white shadow-md shadow-emerald-500/40",
      icono: "fa-circle-check",
      titulo: "Completado",
    },
    warning: {
      badge: "bg-amber-500 text-white shadow-md shadow-amber-500/40",
      icono: "fa-circle-exclamation",
      titulo: "Aviso",
    },
    info: {
      badge: "bg-blue-600 text-white shadow-md shadow-blue-500/40",
      icono: "fa-circle-info",
      titulo: "Información",
    },
  };

  const actual = estilos[tipo] || estilos.info;

  const toast = document.createElement("div");
  toast.className = `pointer-events-auto flex items-center gap-3.5 p-3.5 px-4 rounded-2xl bg-white/20 backdrop-blur-xl border border-white/50 shadow-[0_12px_32px_rgba(0,0,0,0.25)] transition-all duration-300 ease-out -translate-y-4 opacity-0 scale-95`;

  toast.innerHTML = `
    <div class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${actual.badge}">
      <i class="fa-solid ${actual.icono} text-sm"></i>
    </div>
    <div class="flex-1 min-w-0">
      <p class="text-[10px] font-black uppercase tracking-wider text-white/70 leading-none mb-1">${actual.titulo}</p>
      <p class="text-xs font-semibold text-white leading-snug drop-shadow-sm">${mensaje}</p>
    </div>
    <button type="button" class="cursor-pointer text-white/50 hover:text-white transition-colors p-1 shrink-0">
      <i class="fa-solid fa-xmark text-xs"></i>
    </button>
  `;

  toast.querySelector("button").addEventListener("click", () => {
    toast.classList.add("-translate-y-3", "opacity-0", "scale-95");
    setTimeout(() => toast.remove(), 250);
  });

  c.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.remove("-translate-y-4", "opacity-0", "scale-95");
    toast.classList.add("translate-y-0", "opacity-100", "scale-100");
  });

  setTimeout(() => {
    toast.classList.remove("translate-y-0", "opacity-100", "scale-100");
    toast.classList.add("-translate-y-3", "opacity-0", "scale-95");
    setTimeout(() => toast.remove(), 300);
  }, 4200);
};
