document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("btn-modo-seleccionado");
  const menu = document.getElementById("menu-modo");
  const inputModo = document.getElementById("input-modo");
  const textoModo = document.getElementById("texto-modo");
  const flecha = document.getElementById("flecha-modo");

  if (!btn || !menu) return;


  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    menu.classList.toggle("hidden");
    if (flecha) flecha.classList.toggle("rotate-180");
  });


  document.querySelectorAll(".modo-btn").forEach((botonOpcion) => {
    botonOpcion.addEventListener("click", () => {
      const modo = botonOpcion.dataset.modo;
      inputModo.value = modo;
      textoModo.textContent = botonOpcion.textContent.trim();
      menu.classList.add("hidden");
      if (flecha) flecha.classList.remove("rotate-180");
    });
  });


  document.addEventListener("click", (e) => {
    if (!menu.contains(e.target) && !btn.contains(e.target)) {
      menu.classList.add("hidden");
      if (flecha) flecha.classList.remove("rotate-180");
    }
  });
});