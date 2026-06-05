const mensajes = document.querySelector("#mensajes");
const enviar = document.querySelector("#enviar");
const campoEmail = document.querySelector("#email");
const campoContrasenia = document.querySelector("#contrasenia");
const form = document.querySelector("#form");

function verContrasenia(inputId, iconoId) {
  const input = document.getElementById(inputId);
  const icono = document.getElementById(iconoId);
  if (input.type === "password") {
    input.type = "text";
    icono.innerText = "visibility";
  } else {
    input.type = "password";
    icono.innerText = "visibility_off";
  }
}

function temporizadorErr() {
  setTimeout(() => {
    mensajes.innerHTML = "";
  }, 4000);
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = campoEmail.value;
  const contrasenia = campoContrasenia.value;

  try {
    const respuesta = await fetch("/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, contrasenia }),
    });
    const data = await respuesta.json();
    if (!data.success) {
      mensajes.innerText = data.error;
      temporizadorErr();
    } else {
      localStorage.setItem("token", data.token);

      window.location.href = "/welcome";
    }
  } catch (error) {
    console.error("Error: ", error);
    mensajes.innerText = "Erro en la conexion";
    temporizadorErr();
  }
});
