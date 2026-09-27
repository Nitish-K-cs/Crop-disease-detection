from flask import Flask, request, jsonify
from flask_cors import CORS

import numpy as np
from io import BytesIO
from PIL import Image

import onnxruntime as ort
import json
import os


app = Flask(__name__)

CORS(app)


# ============================================================
# Paths
# ============================================================

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

MODEL_PATH = os.path.join(
    BASE_DIR,
    "models",
    "plant_disease.onnx"
)

CLASS_PATH = os.path.join(
    BASE_DIR,
    "models",
    "classes.json"
)


# ============================================================
# Load class names
# ============================================================

with open(CLASS_PATH, "r") as f:
    CLASS_NAMES = json.load(f)

print("Classes:", CLASS_NAMES)


# ============================================================
# Load ONNX model
# ============================================================

MODEL = ort.InferenceSession(
    MODEL_PATH,
    providers=["CPUExecutionProvider"]
)

INPUT_NAME = MODEL.get_inputs()[0].name
OUTPUT_NAME = MODEL.get_outputs()[0].name

print("ONNX model loaded")
print("Input:", INPUT_NAME)
print("Output:", OUTPUT_NAME)


# ============================================================
# Health check
# ============================================================

@app.route("/ping", methods=["GET"])
def ping():

    return "Hello, I am alive"


# ============================================================
# Image preprocessing
# ============================================================

def preprocess_image(data):

    image = Image.open(
        BytesIO(data)
    ).convert("RGB")

    # Same size used during PyTorch training
    image = image.resize((256, 256))

    # Convert to NumPy
    image = np.array(image).astype(np.float32)

    # Convert 0-255 -> 0-1
    image = image / 255.0

    # HWC -> CHW
    image = np.transpose(
        image,
        (2, 0, 1)
    )

    # Add batch dimension
    image = np.expand_dims(
        image,
        axis=0
    )

    return image


# ============================================================
# Prediction
# ============================================================

@app.route("/predict", methods=["POST"])
def predict():

    if "file" not in request.files:

        return jsonify({
            "error": "No file provided"
        }), 400


    file = request.files["file"]

    try:

        # Read image
        image_data = file.read()

        # Preprocess
        image = preprocess_image(image_data)

        # Run ONNX model
        predictions = MODEL.run(
            [OUTPUT_NAME],
            {
                INPUT_NAME: image
            }
        )[0]


        # Model outputs logits
        logits = predictions[0]


        # Convert logits to probabilities
        exp_logits = np.exp(
            logits - np.max(logits)
        )

        probabilities = (
            exp_logits /
            np.sum(exp_logits)
        )


        # Get predicted class
        predicted_index = int(
            np.argmax(probabilities)
        )

        predicted_class = CLASS_NAMES[
            predicted_index
        ]

        confidence = float(
            probabilities[predicted_index]
        )


        return jsonify({

            "class": predicted_class,

            "confidence": confidence

        })


    except Exception as e:

        return jsonify({

            "error": str(e)

        }), 500


# ============================================================
# Start server
# ============================================================

if __name__ == "__main__":

    app.run(
        host="localhost",
        port=8000,
        debug=True
    )