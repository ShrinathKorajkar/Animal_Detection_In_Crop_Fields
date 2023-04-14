import torch
import base64
import numpy as np
import os
import cv2

storedResults = []
count = -1
base = os.path.dirname(os.path.abspath(__file__))

# Declaring some variables    
CONFIDENCE = 0.50
# Bounding Boxes color scheme
ALPHA = 0.2
CELL_FILL = (0, 0, 200)
CELL_BORDER = (0, 0, 255)
_TEXT_THICKNESS_SCALING = 700.0
_TEXT_SCALING = 520.0
normalised_scaling=1.0

def base64_to_image(base64_string):
    base64_data = base64_string.split(",")[1]
    image_bytes = base64.b64decode(base64_data)
    image_array = np.frombuffer(image_bytes, dtype=np.uint8)
    image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)
    return image

def image_to_base64(image):
    result, frame_encoded = cv2.imencode(".jpg", image)
    jpg_as_text = base64.b64encode(frame_encoded).decode()
    b64_src = "data:image/jpeg;base64,"
    base64Image = b64_src + jpg_as_text
    return base64Image

def get_yolov7():
    # model = torch.hub.load(base + '/yolov7', 'custom', base + '/yolov7/yolov7.pt', source='local')
    model = torch.hub.load(base + '/yolov7', 'custom', base + '/yolov7/yolov7-tiny.pt', source='local')
    return model
    
def predict(model, image_path):
    results = model(image_path)
    df = results.pandas().xyxy[0]
    # print(df)
    boxes = []
    detectedList = []
    for _, row in df.iterrows():
        if (row['confidence'] > CONFIDENCE) and ((row['class'] == 0) or (row['class'] < 23 and row['class'] > 13)):
            boxes.append([int(row['xmin']), int(row['ymin']),
                                int(row['xmax']), int(row['ymax']), row['name'] + " " + str(int(float(row['confidence']) * 100)) + "%"])
            detectedList.append(row['name'])

    image = image_path
    overlay = image.copy()
    for table_bbox in boxes:
        cv2.rectangle(overlay, (table_bbox[0], table_bbox[1]),
                    (table_bbox[2], table_bbox[3]), CELL_FILL, -1)
        cv2.rectangle(image, (table_bbox[0], table_bbox[1]),
                    (table_bbox[2], table_bbox[3]), CELL_BORDER, 2)
        thickness = int(round((image.shape[0] * image.shape[1]) / (_TEXT_THICKNESS_SCALING * _TEXT_THICKNESS_SCALING)) * normalised_scaling)
        thickness = max(1, thickness)
        scaling = image.shape[0] / _TEXT_SCALING * normalised_scaling
        size = cv2.getTextSize(table_bbox[4], cv2.FONT_HERSHEY_SIMPLEX, scaling, thickness)[0]
        cv2.putText(image, table_bbox[4], (table_bbox[0], table_bbox[1] - int(size[1] * 0.4)), cv2.FONT_HERSHEY_SIMPLEX, scaling,color=(255,255,255),thickness=thickness)

    image_new = cv2.addWeighted(overlay, ALPHA, image, 1-ALPHA, 0)
    return (image_new, detectedList)