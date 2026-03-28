from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
from io import BytesIO
from PIL import Image
import tensorflow as tf

app = Flask(__name__)
CORS(app)

# Load model
MODEL = tf.keras.models.load_model(r"F:\CODES\Web development\crop-detection\models\1.keras")

CLASS_NAMES = ["Potato___Early_blight", "Potato___Late_blight", "Potato___healthy"]

# Health check route
@app.route('/ping', methods=['GET'])
def ping():
    return "Hello, I am alive"

# Helper function
def read_file_as_image(data) -> np.ndarray:
    image = np.array(Image.open(BytesIO(data)))
    return image

# Prediction route
@app.route('/predict', methods=['POST'])
def predict():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400

    file = request.files['file']
    image = read_file_as_image(file.read())

    img_batch = np.expand_dims(image, 0)
    predictions = MODEL.predict(img_batch)

    predicted_class = CLASS_NAMES[np.argmax(predictions[0])]
    confidence = np.max(predictions[0])

    return jsonify({
        'class': predicted_class,
        'confidence': float(confidence)
    })

if __name__ == "__main__":
    app.run(host='localhost', port=8000, debug=True)