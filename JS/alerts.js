let bankrollAlertShown = false;
let sessionAlertShown = false;

// ==========================
// 💰 ALERTA BANKROLL
// ==========================
window.checkBankrollLimit = function(){

    const settings = getSettings();

    // 🚫 desactivada
    if(!settings.bankrollAlertsEnabled){
        return;
    }

    // 💰 bankroll total
    const bankroll = Number(
        obtenerBankroll()
    );

    // ⚠️ límite alcanzado
    if(
        bankroll <= -Number(settings.bankrollLimit)
        && !bankrollAlertShown
    ){

        Toastify({

            text:
              "💰 Alcanzaste tu límite de bankroll",

            duration: 4000,

            gravity: "top",

            position: "right",

            stopOnFocus: true,

            style: {

                background:
                  "linear-gradient(to right, #dc2626, #991b1b)",

                borderRadius: "12px",

                boxShadow:
                  "0 0 20px rgba(220,38,38,.4)"

            }

        }).showToast();

        bankrollAlertShown = true;
    }
};

// ==========================
// 📉 ALERTA POR SESIÓN
// ==========================
window.checkSessionLimit = function(resultado){

    const settings = getSettings();

    // 🚫 desactivada
    if(!settings.sessionAlertsEnabled){
        return;
    }

    // 🔢 asegurar número real
    resultado = Number(resultado);

    // 🚫 NaN
    if(isNaN(resultado)){
        return;
    }

    // ⚠️ límite sesión
    if(
        resultado <= -Number(settings.sessionLossLimit)
        && !sessionAlertShown
    ){

        Toastify({

            text:
              "📉 Superaste tu límite por sesión",

            duration: 4000,

            gravity: "top",

            position: "right",

            stopOnFocus: true,

            style: {

                background:
                  "linear-gradient(to right, #ea580c, #c2410c)",

                borderRadius: "12px",

                boxShadow:
                  "0 0 20px rgba(234,88,12,.4)"

            }

        }).showToast();

        sessionAlertShown = true;
    }
};