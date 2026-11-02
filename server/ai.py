import requests

LM_STUDIO_URL = "http://localhost:1234/v1/chat/completions"

MODEL = "gemma-4-e2b-it-qat"


def generate_ai_message(telemetry):

    prompt = f"""
You are the monitoring assistant for SOLACE ROVER,
an autonomous multi-hazard emergency surveillance rover.

You are observing the rover's CURRENT REAL SENSOR DATA.

Temperature: {telemetry.get("temperature")}
Humidity: {telemetry.get("humidity")}
Smoke: {telemetry.get("smoke")}
Vibration: {telemetry.get("vibration")}

Obstacles:
Front: {telemetry.get("obstacles", {}).get("front")}
Left: {telemetry.get("obstacles", {}).get("left")}
Right: {telemetry.get("obstacles", {}).get("right")}
Rear: {telemetry.get("obstacles", {}).get("rear")}

Rover movement: {telemetry.get("rover", {}).get("movement")}
Rover online: {telemetry.get("rover", {}).get("online")}

Observe these conditions like a human monitoring the rover.

Give ONE short, natural observation.

Rules:
- Use only the sensor information provided.
- Never invent measurements.
- Do not control the rover.
- Do not give instructions to the rover.
- Do not exaggerate the situation.
- Mention important detected conditions naturally.
- If everything is normal, say that naturally.
- Return ONLY the final observation.
Do not show your reasoning.
Do not show a thinking process.
Do not repeat the sensor data.
Do not write headings such as "Analysis", "Thinking", or "Observation".
Keep the final message to one or two natural sentences.
"""

    try:

        response = requests.post(
            LM_STUDIO_URL,
            json={
                "model": MODEL,
                "messages": [
                    {
                        "role": "system",
                        "content": "You are a concise rover monitoring assistant."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                "temperature": 0.4,
                "reasoning_effort": "none",
                "max_tokens": 100
            },
            timeout=10
        )

        response.raise_for_status()

        result = response.json()

        # Get the first AI choice
        choice = result.get("choices", [])[0]

        # Get the message
        message = choice.get("message", {})

        # Get generated text
        content = message.get("content")

        if isinstance(content, str) and content.strip():
            return content.strip()

        # Some local models may put generated text
        # in reasoning_content
        reasoning = message.get("reasoning_content")

        if isinstance(reasoning, str) and reasoning.strip():
            return reasoning.strip()

        print("AI ERROR: No generated text found")
        print("MESSAGE:", message)

        return "AI observation unavailable."

    except requests.exceptions.RequestException as error:

        print("AI REQUEST ERROR:", repr(error))

        return "AI observation unavailable."

    except Exception as error:

        print("AI PARSING ERROR:", repr(error))

        return "AI observation unavailable."