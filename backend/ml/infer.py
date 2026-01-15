import os
import base64
import json
from groq import Groq

try:
    from middleware.logging import logger
except ImportError:
    import logging
    logger = logging.getLogger(__name__)

# Initialize Groq client
# Note: In production, ensure GROQ_API_KEY is set in environment variables
_client = None

def get_client():
    global _client
    if _client is None:
        api_key = os.environ.get("GROQ_API_KEY")
        if not api_key:
            logger.warning("GROQ_API_KEY not found in environment variables. Inference will fail.")
        _client = Groq(api_key=api_key)
    return _client

def encode_image(image_bytes):
    return base64.b64encode(image_bytes).decode('utf-8')

def predict_image(image_bytes, demo_mode=True, description=""):
    """
    Inference using Groq Llama 3.2 Vision Model.
    Provides better accuracy and detailed pollution analysis.
    """
    try:
        client = get_client()
        base64_image = encode_image(image_bytes)
        
        prompt = f"""
        Analyze this image for water pollution and environmental issues.
        Context from user: "{description}"
        
        Mandatory Categories (choose the most accurate):
        - 'plastic': visible plastic waste, bottles, nets
        - 'oil_spill': oily sheen, dark sludge on water
        - 'sewage': murky, brown/black water, visible drains
        - 'algal_bloom': green/blue-green surface covering
        - 'chemical_waste': unusual colors (neon, milky), foam
        - 'clean': clear water, healthy aquatic life, no visible pollution
        - 'invalid_image': NOT a water body/environmental scene (e.g., car, tree, person, indoors)
        
        Task:
        1. Identify the primary type from the list above. DO NOT use 'unknown' unless absolutely impossible to identify.
        2. Assign a confidence score (0.0 to 1.0).
        3. provide a brief reason.
        
        Return the result ONLY as a JSON object:
        {{
            "class": "category_name",
            "confidence": 0.95,
            "reason": "..."
        }}
        """

        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{base64_image}",
                            },
                        },
                    ],
                }
            ],
            model="meta-llama/llama-4-maverick-17b-128e-instruct",
            # Note: response_format={"type": "json_object"} sometimes fails with vision on Groq
            # We will rely on prompt enforcement and manual parsing if needed.
        )

        response_content = chat_completion.choices[0].message.content
        logger.debug(f"Raw Groq Response: {response_content}")
        
        # Robust JSON extraction (Llama 4 often wraps in markdown)
        import re
        json_match = re.search(r'\{.*\}', response_content, re.DOTALL)
        if json_match:
            try:
                result = json.loads(json_match.group(0))
            except json.JSONDecodeError:
                logger.warning("Failed to parse extracted JSON, falling back to heuristic parsing or failure.")
                result = {} 
        else:
            logger.warning("No JSON found in response")
            result = {}

        
        logger.info(f"Groq Inference Result: {result.get('class')} ({result.get('confidence')}) - Reason: {result.get('reason')}")
        
        return {
            "class": result.get("class", "unknown"),
            "confidence": float(result.get("confidence", 0.0))
        }

    except Exception as e:
        logger.error(f"Groq Inference error: {e}", exc_info=True)
        return {"class": "unknown", "confidence": 0.0}

def get_shared_model():
    """Maintained for compatibility with main.py pre-loading logic."""
    logger.info("⚡ Groq Vision API Integration Initialized.")
    return "GROQ_ACTIVE"
