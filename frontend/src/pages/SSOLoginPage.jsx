import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Loader2, AlertCircle, Shield, ExternalLink } from "lucide-react";

// Origen de Pandora SSO (ajustar segun ambiente)
const PANDORA_ORIGIN = import.meta.env.VITE_PANDORA_ORIGIN || "http://localhost:5175";
const PANDORA_URL    = import.meta.env.VITE_PANDORA_URL    || "http://localhost:5175";

const SSOLoginPage = () => {
  const { loginWithPandora } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState("waiting"); // waiting | loading | error
  const [errorMsg, setErrorMsg] = useState("");
  const childWindowRef = useRef(null);

  useEffect(() => {
    let intervalId = null;

    console.log("[Biaticos SSO] Iniciando receptor y bucle de consulta de token...");

    const requestToken = () => {
      // 1. Intentar con window.opener (si Pandora nos abrió)
      if (window.opener && !window.opener.closed) {
        console.log("[Biaticos SSO] Enviando solicitud a window.opener...");
        window.opener.postMessage("CERBERUS_REQUEST_SSO_TOKEN", "*");
      }
      // 2. Intentar con childWindow (si abrimos Pandora como pestaña hija)
      if (childWindowRef.current && !childWindowRef.current.closed) {
        console.log("[Biaticos SSO] Enviando solicitud a pestaña hija...");
        childWindowRef.current.postMessage("CERBERUS_REQUEST_SSO_TOKEN", "*");
      }
    };

    // Ejecutar inmediatamente y luego cada 1.5 segundos
    requestToken();
    intervalId = setInterval(requestToken, 1500);

    // Escuchar la entrega del token desde Pandora
    const handleMessage = async (event) => {
      // Aceptar tanto el origen exacto como localhost generico en desarrollo y produccion
      const isValidOrigin =
        event.origin === PANDORA_ORIGIN ||
        event.origin.startsWith("http://localhost") ||
        event.origin.startsWith("http://127.0.0.1") ||
        event.origin === "https://pandora.pcmejia.com" ||
        event.origin === "https://pandora.pcmejia.com.co";

      if (!isValidOrigin) return;

      const data = event.data;
      if (!data || data.type !== "CERBERUS_SSO_TOKEN_DELIVERY") return;

      const token = data.token;
      if (!token) return;

      // Si recibimos un token valido, detener el intervalo de reintentos
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }

      console.log("[Biaticos SSO] Token SSO recibido de Pandora. Autenticando...");
      setStatus("loading");

      try {
        await loginWithPandora(token);
        navigate("/dashboard");
      } catch (err) {
        console.error("[Biaticos SSO] Error al validar el token:", err);
        setStatus("error");
        setErrorMsg(err.message || "Error al iniciar sesion. Vuelve a intentarlo desde Pandora.");
      }
    };

    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, []);

  const openPandora = () => {
    console.log("[Biaticos SSO] Abriendo pestaña de Pandora SSO...");
    const win = window.open(PANDORA_URL, "_blank");
    childWindowRef.current = win;
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 60%, #f8fafc 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      padding: "24px",
    }}>
      {/* Circulos decorativos */}
      <div style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: "-15%", right: "-8%", width: "500px", height: "500px", borderRadius: "50%", background: "radial-gradient(circle, rgba(37,99,235,0.05) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: "-10%", left: "-5%", width: "400px", height: "400px", borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.04) 0%, transparent 70%)" }} />
      </div>

      <div style={{
        width: "100%",
        maxWidth: "420px",
        background: "rgba(255,255,255,0.95)",
        backdropFilter: "blur(24px)",
        border: "1px solid rgba(0,0,0,0.06)",
        borderRadius: "24px",
        padding: "52px 40px 44px",
        boxShadow: "0 32px 80px rgba(15,23,42,0.08)",
        position: "relative",
        zIndex: 1,
        textAlign: "center",
      }}>
        {/* Logo */}
        <div style={{ marginBottom: "32px" }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "64px",
            height: "64px",
            background: "linear-gradient(135deg, #1d4ed8, #4f46e5)",
            borderRadius: "18px",
            marginBottom: "20px",
            boxShadow: "0 8px 32px rgba(37,99,235,0.2)",
          }}>
            <Shield style={{ width: "30px", height: "30px", color: "#fff" }} />
          </div>
          <div style={{ fontSize: "26px", fontWeight: "900", color: "#0f172a", letterSpacing: "-0.5px" }}>PCM</div>
          <div style={{ fontSize: "10px", color: "#64748b", letterSpacing: "3.5px", textTransform: "uppercase", marginTop: "2px" }}>ENGINEERING</div>
        </div>

        <h1 style={{ fontSize: "20px", fontWeight: "700", color: "#0f172a", margin: "0 0 8px" }}>
          Control de Viaticos
        </h1>
        <p style={{ fontSize: "13px", color: "#475569", margin: "0 0 36px", lineHeight: 1.6 }}>
          Autenticacion integrada con Pandora SSO
        </p>

        {/* Estado: esperando */}
        {status === "waiting" && (
          <div>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              background: "rgba(37,99,235,0.08)",
              border: "1px solid rgba(37,99,235,0.2)",
              borderRadius: "14px",
              padding: "18px 20px",
              marginBottom: "24px",
            }}>
              <Loader2 style={{ width: "18px", height: "18px", color: "#2563eb", flexShrink: 0, animation: "spin 1.5s linear infinite" }} />
              <span style={{ fontSize: "13px", color: "#1d4ed8", fontWeight: "500" }}>
                Esperando sesion de Pandora SSO...
              </span>
            </div>
            <p style={{ fontSize: "12px", color: "#475569", lineHeight: 1.7 }}>
              Esta aplicacion recibe tu sesion automaticamente desde{" "}
              <strong style={{ color: "#0f172a" }}>Pandora</strong>.
              <br />
              Si accediste directamente, abre primero desde el portal:
            </p>
            <button
              onClick={openPandora}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                marginTop: "14px",
                background: "rgba(0,0,0,0.03)",
                border: "1px solid rgba(0,0,0,0.08)",
                borderRadius: "10px",
                padding: "9px 18px",
                color: "#475569",
                fontSize: "12px",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(0,0,0,0.15)"}
              onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(0,0,0,0.08)"}
            >
              <ExternalLink style={{ width: "13px", height: "13px" }} />
              Abrir Pandora SSO
            </button>
          </div>
        )}

        {/* Estado: cargando */}
        {status === "loading" && (
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "12px",
          }}>
            <Loader2 style={{ width: "32px", height: "32px", color: "#3b82f6", animation: "spin 1s linear infinite" }} />
            <span style={{ fontSize: "14px", color: "#475569" }}>Verificando credenciales...</span>
          </div>
        )}

        {/* Estado: error */}
        {status === "error" && (
          <div>
            <div style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.2)",
              borderRadius: "12px",
              padding: "14px 16px",
              marginBottom: "16px",
              textAlign: "left",
            }}>
              <AlertCircle style={{ width: "16px", height: "16px", color: "#f87171", flexShrink: 0, marginTop: "1px" }} />
              <span style={{ fontSize: "13px", color: "#dc2626", lineHeight: 1.5 }}>{errorMsg}</span>
            </div>
            <button
              onClick={() => { setStatus("waiting"); setErrorMsg(""); }}
              style={{
                background: "rgba(0,0,0,0.03)",
                border: "1px solid rgba(0,0,0,0.08)",
                borderRadius: "10px",
                padding: "9px 20px",
                color: "#475569",
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              Reintentar
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default SSOLoginPage;