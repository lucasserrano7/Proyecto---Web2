document.addEventListener("click",async  (e) =>{
    if(e.target.classList.contains("seguir-btn")){
        e.preventDefault();
console.log("¡Hiciste clic en el botón correcto!");
        const btnFollow = e.target;
        const creatorId = btnFollow.dataset.creatorId;

        if (!creatorId) {
            console.error("No se encontró el ID del creador en el botón.");
            return;
        }

        try {
            const response = await fetch("/seguidores/seguir", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ creatorId }),
            });
            const result = await response.json();

            if(result.success){
                if(result.siguiendo){
                    btnFollow.textContent = "Siguiendo";
                    btnFollow.classList.remove("bg-blue-300/30", "hover:bg-blue-200/30");
                    btnFollow.classList.add("bg-green-600", "hover:bg-green-700");
                } else {
                    btnFollow.textContent = "Seguir";
                    btnFollow.classList.remove("bg-green-600", "hover:bg-green-700");
                    btnFollow.classList.add("bg-blue-300/30", "hover:bg-blue-200/30");

                }
            } else {
                console.error("Error en la respuesta del servidor:", result.message);
            }
        } catch (error) {
            console.error("Error al enviar la solicitud de seguimiento:", error);
        }
    }


});