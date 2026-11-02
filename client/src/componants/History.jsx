
import React, { useEffect, useRef, useState } from "react";

const API_URL = "http://localhost:5000";

function History() {
  const [mode, setMode] = useState("AUTO");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const commandInterval = useRef(null);

  // Fetch current mode from Flask
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch(`${API_URL}/api/status`);

        if (!response.ok) {
          throw new Error("Failed to fetch rover status");
        }

        const data = await response.json();

        if (data.control?.mode) {
          setMode(data.control.mode);
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchStatus();

    const interval = setInterval(fetchStatus, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(commandInterval.current);
    };
  }, []);

  // Change Auto / Manual mode
  const changeMode = async (newMode) => {
    if (loading || mode === newMode) return;

    stopCommand();

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/api/control`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode: newMode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Mode change failed");
      }

      setMode(data.mode);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Send movement command
  const sendCommand = async (command) => {
    try {
      const response = await fetch(`${API_URL}/api/control`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          command,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Command failed");
      }

      setError("");
    } catch (err) {
      setError(err.message);
    }
  };

  // Stop movement
  const stopCommand = async () => {
    clearInterval(commandInterval.current);
    commandInterval.current = null;

    try {
      await sendCommand("STOP");
    } catch (err) {
      console.error(err);
    }
  };

  // Start movement while button is held
  const startCommand = (command) => {
    if (mode !== "MANUAL") return;

    clearInterval(commandInterval.current);

    sendCommand(command);

    commandInterval.current = setInterval(() => {
      sendCommand(command);
    }, 500);
  };

  // Emergency stop
  const emergencyStop = async () => {
    clearInterval(commandInterval.current);
    commandInterval.current = null;

    try {
      const response = await fetch(
        `${API_URL}/api/emergency-stop`,
        { method: "POST" }
      );

      if (!response.ok) {
        throw new Error("Emergency stop request failed");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  // Controller button
  const ControlButton = ({ command, icon, label }) => (
    <button
      type="button"
      disabled={mode !== "MANUAL" || loading}
      onPointerDown={(event) => {
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        startCommand(command);
      }}
      onPointerUp={stopCommand}
      onPointerCancel={stopCommand}
      onLostPointerCapture={stopCommand}
      className="
        w-16 h-16 rounded-xl
        bg-[#343a40] text-white text-2xl
        flex flex-col items-center justify-center
        hover:bg-[#495057]
        active:scale-95
        disabled:opacity-30 disabled:cursor-not-allowed
        transition
        select-none touch-none
      "
      aria-label={label}
    >
      {icon}
      <span className="text-[9px]">{label}</span>
    </button>
  );

  return (
    <div className="bg-[#000814] flex-1 text-white mt-2 rounded-xl p-3">

      {/* Header */}
      <div className="rounded-lg p-2 bg-[#343a40]">
        <h1 className="font-semibold">ROVER CONTROLLER</h1>
      </div>

      {/* Mode switching */}
      <div className="mt-4">
        <p className="text-[#adb5bd] text-sm mb-2">
          OPERATING MODE
        </p>

        <div className="grid grid-cols-2 gap-2">

          <button
            onClick={() => changeMode("AUTO")}
            disabled={loading}
            className={`rounded-lg p-3 font-semibold transition ${
              mode === "AUTO"
                ? "bg-green-600 text-white"
                : "bg-[#343a40] text-gray-300"
            }`}
          >
            AUTO
          </button>

          <button
            onClick={() => changeMode("MANUAL")}
            disabled={loading}
            className={`rounded-lg p-3 font-semibold transition ${
              mode === "MANUAL"
                ? "bg-blue-600 text-white"
                : "bg-[#343a40] text-gray-300"
            }`}
          >
            MANUAL
          </button>

        </div>
      </div>

      {/* Current mode */}
      <div className="mt-3 text-center">
        <p className="text-sm text-[#adb5bd]">
          Current mode
        </p>

        <p className={`font-bold ${
          mode === "AUTO" ? "text-green-400" : "text-blue-400"
        }`}>
          {mode}
        </p>
      </div>

      {/* Movement controller */}
      <div className="mt-5">

        <p className="text-[#adb5bd] text-sm text-center mb-3">
          MOVEMENT CONTROLLER
        </p>

        <div className="flex flex-col items-center gap-2">

          <ControlButton
            command="FORWARD"
            icon="↑"
            label="FORWARD"
          />

          <div className="flex items-center gap-3">

            <ControlButton
              command="LEFT"
              icon="←"
              label="LEFT"
            />

            <button
              type="button"
              onClick={stopCommand}
              disabled={mode !== "MANUAL"}
              className="
                w-16 h-16 rounded-xl
                bg-red-600 text-white font-bold
                hover:bg-red-700
                disabled:opacity-30
              "
            >
              STOP
            </button>

            <ControlButton
              command="RIGHT"
              icon="→"
              label="RIGHT"
            />

          </div>

          <ControlButton
            command="BACKWARD"
            icon="↓"
            label="BACKWARD"
          />

        </div>
      </div>

      {/* Emergency stop */}
      <button
        type="button"
        onClick={emergencyStop}
        className="
          w-full mt-5 p-3 rounded-lg
          bg-red-700 hover:bg-red-800
          font-bold transition
        "
      >
        EMERGENCY STOP
      </button>

      {/* Error display */}
      {error && (
        <p className="mt-3 text-red-400 text-sm text-center">
          {error}
        </p>
      )}

      {mode === "AUTO" && (
        <p className="mt-3 text-center text-xs text-[#adb5bd]">
          Manual controls are disabled in automatic mode.
        </p>
      )}

    </div>
  );
}

export default History;
