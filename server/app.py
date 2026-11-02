
from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
from ai import generate_ai_message
import threading
import time

app = Flask(__name__)
CORS(app)

# -----------------------------
# CONFIGURATION
# -----------------------------

MANUAL_COMMAND_TIMEOUT = 2.0
TELEMETRY_TIMEOUT = 10.0

VALID_MODES = {"AUTO", "MANUAL"}
VALID_COMMANDS = {
    "FORWARD",
    "BACKWARD",
    "LEFT",
    "RIGHT",
    "STOP"
}

data_lock = threading.RLock()

# -----------------------------
# LIVE SYSTEM LOGS
# -----------------------------

system_logs = []

# -----------------------------
# CONTROL STATE
# -----------------------------

control_state = {
    "mode": "AUTO",
    "command": "STOP",
    "command_id": 0,
    "command_time": 0
}

# -----------------------------
# LATEST ROVER DATA
# -----------------------------

latest_data = {
    "connection": {
        "status": "OFFLINE",
        "response": None,
        "connectivity": "DISCONNECTED"
    },

    "temperature": 0,
    "humidity": 0,
    "smoke": False,

    "obstacles": {
        "front": False,
        "left": False,
        "right": False,
        "rear": False
    },

    "vibration": False,

    "rover": {
        "movement": "STOPPED",
        "online": False
    },

    "control": {
        "mode": "AUTO",
        "command": "STOP"
    },

    "ai_message": "Waiting for rover telemetry...",
    "last_update": None
}


# -----------------------------
# LOG FUNCTION
# -----------------------------

def add_log(message):
    timestamp = datetime.now().strftime("%H:%M:%S")
    log = f"[{timestamp}] {message}"

    print(log)

    with data_lock:
        system_logs.append(log)

        if len(system_logs) > 100:
            system_logs.pop(0)


# -----------------------------
# AI OBSERVER
# -----------------------------

def ai_observer():
    while True:
        try:
            with data_lock:
                has_telemetry = latest_data["last_update"] is not None
                data_snapshot = dict(latest_data)

            if has_telemetry:
                message = generate_ai_message(data_snapshot)

                with data_lock:
                    latest_data["ai_message"] = message

                print(f"[AI] {message}")

        except Exception as error:
            print(f"[AI ERROR] {error}")

        time.sleep(8)


# -----------------------------
# HOME
# -----------------------------

@app.get("/")
def home():
    return jsonify({
        "project": "SOLACE ROVER",
        "status": "online"
    })


# -----------------------------
# RECEIVE TELEMETRY
# -----------------------------

@app.post("/api/telemetry")
def receive_telemetry():

    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "success": False,
            "message": "Invalid telemetry"
        }), 400

    with data_lock:

        latest_data["temperature"] = data.get(
            "temperature",
            latest_data["temperature"]
        )

        latest_data["humidity"] = data.get(
            "humidity",
            latest_data["humidity"]
        )

        latest_data["smoke"] = data.get(
            "smoke",
            latest_data["smoke"]
        )

        latest_data["obstacles"] = data.get(
            "obstacles",
            latest_data["obstacles"]
        )

        latest_data["vibration"] = data.get(
            "vibration",
            latest_data["vibration"]
        )

        rover_data = data.get("rover", {})

        if isinstance(rover_data, dict):
            latest_data["rover"].update(rover_data)

        latest_data["rover"]["online"] = True

        latest_data["connection"]["status"] = "ONLINE"
        latest_data["connection"]["response"] = 200
        latest_data["connection"]["connectivity"] = "CONNECTED"

        latest_data["last_update"] = datetime.now().isoformat()

    add_log("Received telemetry from rover")

    return jsonify({
        "success": True,
        "message": "Telemetry received"
    })


# -----------------------------
# SET MODE AND MOVEMENT COMMAND
# -----------------------------

@app.post("/api/control")
def control_rover():

    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "success": False,
            "message": "Invalid control request"
        }), 400

    mode = data.get("mode")
    command = data.get("command")

    with data_lock:

        # Change operating mode
        if mode is not None:

            mode = str(mode).upper()

            if mode not in VALID_MODES:
                return jsonify({
                    "success": False,
                    "message": "Invalid mode"
                }), 400

            if mode != control_state["mode"]:

                control_state["mode"] = mode

                # Always stop when changing modes
                control_state["command"] = "STOP"
                control_state["command_id"] += 1
                control_state["command_time"] = time.monotonic()

                add_log(f"Rover mode changed to {mode}")

        # Accept movement commands only in MANUAL mode
        if command is not None:

            command = str(command).upper()

            if command not in VALID_COMMANDS:
                return jsonify({
                    "success": False,
                    "message": "Invalid movement command"
                }), 400

            if control_state["mode"] != "MANUAL":
                return jsonify({
                    "success": False,
                    "message": "Manual commands disabled in AUTO mode"
                }), 409

            control_state["command"] = command
            control_state["command_id"] += 1
            control_state["command_time"] = time.monotonic()

            add_log(f"Manual command received: {command}")

        latest_data["control"]["mode"] = control_state["mode"]
        latest_data["control"]["command"] = control_state["command"]

        return jsonify({
            "success": True,
            "mode": control_state["mode"],
            "command": control_state["command"],
            "command_id": control_state["command_id"]
        })


# -----------------------------
# ESP32 POLLS FOR COMMAND
# -----------------------------

@app.get("/api/command")
def get_command():

    with data_lock:

        mode = control_state["mode"]
        command = control_state["command"]

        # Expire old manual commands
        if mode == "MANUAL":

            elapsed = time.monotonic() - control_state["command_time"]

            if elapsed > MANUAL_COMMAND_TIMEOUT:
                command = "STOP"

        else:
            command = "STOP"

        return jsonify({
            "mode": mode,
            "command": command,
            "command_id": control_state["command_id"]
        })


# -----------------------------
# EMERGENCY STOP
# -----------------------------

@app.post("/api/emergency-stop")
def emergency_stop():

    with data_lock:

        control_state["command"] = "STOP"
        control_state["command_id"] += 1
        control_state["command_time"] = time.monotonic()

        latest_data["control"]["command"] = "STOP"

    add_log("EMERGENCY STOP requested")

    return jsonify({
        "success": True,
        "command": "STOP"
    })


# -----------------------------
# GET LOGS
# -----------------------------

@app.get("/api/logs")
def get_logs():

    with data_lock:
        return jsonify(list(system_logs))


# -----------------------------
# GET CURRENT STATUS
# -----------------------------

@app.get("/api/status")
def status():

    with data_lock:

        result = dict(latest_data)

        last_update = latest_data["last_update"]

        if last_update is not None:

            last_time = datetime.fromisoformat(last_update)
            elapsed = (datetime.now() - last_time).total_seconds()

            if elapsed > TELEMETRY_TIMEOUT:

                result["connection"] = {
                    "status": "OFFLINE",
                    "response": None,
                    "connectivity": "DISCONNECTED"
                }

                result["rover"] = dict(latest_data["rover"])
                result["rover"]["online"] = False

        result["control"] = {
            "mode": control_state["mode"],
            "command": control_state["command"]
        }

        return jsonify(result)


# -----------------------------
# START SERVER
# -----------------------------

if __name__ == "__main__":

    ai_thread = threading.Thread(
        target=ai_observer,
        daemon=True
    )

    ai_thread.start()

    app.run(
        host="0.0.0.0",
        port=5000,
        debug=False
    )
