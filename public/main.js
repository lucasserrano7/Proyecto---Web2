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
      const imagenId = form.querySelector('input[name="ImagenId"]').value;
      if (!inputTexto.value.trim()) return;

      const response = await fetch("/comentarios/new", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          ImagenId: imagenId,
          texto: inputTexto.value,
        }),
      });

      if (response.ok) {
        const nuevoComentario = await response.json();

        const lista = document.getElementById(`lista-comentarios-${imagenId}`);
        const nuevoDiv = document.createElement("div");
        nuevoDiv.className = "bg-white p-2 rounded-lg mb-2";

        nuevoDiv.innerHTML = `${nuevoComentario.comentario.texto}`;
        lista.appendChild(nuevoDiv);

        inputTexto.value = "";
      }
    });
  });
});
  const carruselImgs = {};
  function cambiarFoto(publiId, dir) {
    const slider = document.getElementById(`slider-${publiId}`);
    const limite = slider.children.length;
    if (carruselImgs[publiId] === undefined) carruselImgs[publiId] = 0;

    carruselImgs[publiId] += dir;
    if (carruselImgs[publiId] >= limite) carruselImgs[publiId] = 0;
    if (carruselImgs[publiId] < 0) carruselImgs[publiId] = limite - 1;

    slider.style.transform = `translateX(-${carruselImgs[publiId] * 100}%)`;
  }
  async function enviarValoracion( publicacionId, puntaje) {
    try {
      const response = await fetch("/valoraciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ puntaje: puntaje, publicacionId: publicacionId }),
      });

      const data = await response.json();
      if (response.ok) {
        const promedioElem = document.getElementById(
          `promedio-${publicacionId}`,
        );
        if (promedioElem) {
        }
        promedioElem.textContent = `Promedio: ${data.promedio}`;
      }
    } catch (error) {
      console.error("Error al enviar la valoración:", error);
    }
  }
