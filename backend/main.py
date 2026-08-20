#this is a fastAPI server code
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import tensorflow as tf
from PIL import Image
import numpy as np
import io

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

print("Loading TFLite Model...")
MODEL_PATH = "plant_disease_model.tflite"

# Load TFLite interpreter
interpreter = tf.lite.Interpreter(model_path=MODEL_PATH)
interpreter.allocate_tensors()

input_details = interpreter.get_input_details()
output_details = interpreter.get_output_details()
print("TFLite Model Loaded Successfully!")

# --- PASTE YOUR COLAB CLASS NAMES HERE ---
CLASS_NAMES = [
    "Apple - Apple Scab",
    "Apple - Black Rot",
    "Apple - Cedar Apple Rust",
    "Apple - Healthy",
    "Bell Pepper - Bacterial Spot",
    "Bell Pepper - Healthy",
    "Cherry - Healthy",
    "Cherry - Powdery Mildew",
    "Corn (Maize) - Cercospora Leaf Spot",
    "Corn (Maize) - Common Rust",
    "Corn (Maize) - Healthy",
    "Corn (Maize) - Northern Leaf Blight",
    "Grape - Black Rot",
    "Grape - Esca (Black Measles)",
    "Grape - Healthy",
    "Grape - Leaf Blight",
    "Peach - Bacterial Spot",
    "Peach - Healthy",
    "Potato - Early Blight",
    "Potato - Healthy",
    "Potato - Late Blight",
    "Strawberry - Healthy",
    "Strawberry - Leaf Scorch",
    "Tomato - Bacterial Spot",
    "Tomato - Early Blight",
    "Tomato - Healthy",
    "Tomato - Late Blight",
    "Tomato - Septoria Leaf Spot",
    "Tomato - Yellow Leaf Curl Virus",
]

def prepare_image(image_bytes):
    """Resizes and formats image for TFLite input tensor."""
    img = Image.open(io.BytesIO(image_bytes))
    if img.mode != "RGB":
        img = img.convert("RGB")
        
    img = img.resize((224, 224))
    img_array = np.array(img, dtype=np.float32)
    img_array = np.expand_dims(img_array, axis=0) # Shape: (1, 224, 224, 3)
    return img_array

@app.post("/predict")
async def predict_disease(file: UploadFile = File(...)):
    image_bytes = await file.read()
    img_array = prepare_image(image_bytes)
    
    # Run prediction via TFLite Interpreter
    interpreter.set_tensor(input_details[0]['index'], img_array)
    interpreter.invoke()
    predictions = interpreter.get_tensor(output_details[0]['index'])
    print("Predictions:\n",predictions,"\n")
    predicted_class_index = np.argmax(predictions[0])
    predicted_class_name = CLASS_NAMES[predicted_class_index]
    confidence = float(np.max(predictions[0]))
    
    return {
        "disease": predicted_class_name,
        "confidence": round(confidence * 100, 2)
    }

@app.get("/")
async def root():
    return {"message": "Plant Disease TFLite API is running!"}