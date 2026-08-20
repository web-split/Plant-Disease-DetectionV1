# Plant Disease Diagnostic Model

This repository contains a lightweight deep learning model designed to classify plant leaf diseases from single-leaf images. The project uses an efficient convolutional neural network architecture optimized for quick response times and high diagnostic performance.

---

### 🛠️ Tech Stack Used

| Component | Technology / Library |
| --- | --- |
| **Frontend** | React |
| **Backend API** | FastAPI / Flask |
| **Model Architecture** | EfficientNet / MobileNet |
| **Image Processing** | OpenCV |
| **Deep Learning Frameworks** | PyTorch / TensorFlow |

---

### 🚀 Workflow & System Architecture

1. **Image Input**
* The user uploads a single, closely cropped image of a plant leaf through the web frontend interface.


2. **Data Preprocessing**
* The uploaded image is resized, normalized, and preprocessed using OpenCV to match the input specifications of the neural network.


3. **Inference & Prediction**
* The image is passed to our deep learning classifier based on EfficientNet and MobileNet architecture.
* The model analyzes visual patterns, spots, and discoloration to classify whether the leaf is healthy or affected by a specific disease.


4. **Output Generation**
* The prediction result along with the model confidence score is returned through a REST API built with FastAPI and Flask.
* Results are rendered dynamically on the React user interface.



---

### ⚠️ Current Limitations

* **Single-Leaf Input Requirement:** The classifier expects a clearly visible, isolated leaf. If an image contains multiple leaves, stems, or background clutter, accuracy drops significantly.
* **Sensitivity to Background Noise:** Cluttered surroundings such as soil, hands holding the leaf, weeds, or harsh shadows can distort the feature extraction layers.
* **Domain Shift:** Models trained on clean, laboratory-style datasets struggle when exposed to complex real-world field conditions with inconsistent lighting and camera angles.

---

### 🔮 Future Scope & Proposed Solutions

* **1. Two-Stage Pipeline Using YOLO**
* **Stage 1 (Leaf Detection):** Integrate a YOLO object detection model as a front-end processor to scan full field images, detect individual leaves, crop them out, and eliminate background noise automatically.
* **Stage 2 (Disease Classification):** Pass the isolated leaf crops directly into our existing EfficientNet / MobileNet classification model to perform final disease diagnosis.


* **2. Explainable AI (Grad-CAM Integration)**
* Integrate Grad-CAM (Gradient-weighted Class Activation Mapping) to generate visual heatmaps over the leaves, showing users exactly which lesions or discoloration spots triggered the model's decision.


* **3. Offline Edge Deployment**
* Optimize and convert the model using TFLite or TensorRT to run locally on mobile devices, enabling offline disease diagnosis for farmers operating in low-connectivity areas.