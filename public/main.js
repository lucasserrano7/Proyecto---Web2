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
      if (!inputTexto.value.trim() || !imagenId) return;

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
        if(lista){
        const nuevoDiv = document.createElement("div");
        nuevoDiv.className = "p-2 border-b border-black/20";

        nuevoDiv.innerHTML = `
            <p class="text-blue-500 font-semibold">@${nuevoComentario.comentario.Usuario ? nuevoComentario.comentario.Usuario.username : (document.querySelector('h2.text-3xl') ? document.querySelector('h2.text-3xl').textContent.replace('@', '') : 'Tú')}</p>
            <span>${nuevoComentario.comentario.texto}</span>
          `;
        lista.appendChild(nuevoDiv);

        const primero = lista.querySelector('.text-gray-600');
        if (primero) {
          primero.remove();
        }
        inputTexto.value = "";
      }
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
      if (promedioElem) {
      }

      const contenedorEstrellas = document.querySelector(
        `.valoracion[data-id="${imagenId}"]`,
      );

      const cont = document.querySelector(`.valoracion[data-id="${imagenId}"]`);

      const cajaValoracion = contenedorEstrellas || cont;
      if (cajaValoracion) {
        const estrellas = cajaValoracion.querySelectorAll("i");
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

      promedioElem.textContent = `Promedio: ${data.promedio}`;
    }
  } catch (error) {
    console.error("Error al enviar la valoración:", error);
  }
}
