# crop_stage_detector.py
import cv2
import numpy as np
import tensorflow as tf
from tensorflow import keras
from PIL import Image
import io
import base64

class TomatoStageDetector:
    def __init__(self):
        self.stages = {
            'germination': {'days': [1, 14], 'description': 'Seed sprouting, first leaves'},
            'seedling': {'days': [15, 30], 'description': 'True leaves developing'},
            'vegetative': {'days': [31, 45], 'description': 'Rapid leaf and stem growth'},
            'flowering': {'days': [46, 65], 'description': 'Flower formation and pollination'},
            'fruiting': {'days': [66, 85], 'description': 'Fruit development and ripening'},
            'harvest': {'days': [86, 120], 'description': 'Fruits ready for harvest'}
        }
        
        # Color ranges for tomato stages (HSV)
        self.color_ranges = {
            'germination': {'lower': [25, 40, 40], 'upper': [35, 100, 100]},  # Light green
            'seedling': {'lower': [30, 50, 50], 'upper': [40, 150, 150]},     # Medium green
            'vegetative': {'lower': [35, 60, 60], 'upper': [45, 200, 200]},   # Dark green
            'flowering': {'lower': [0, 0, 150], 'upper': [10, 50, 255]},      # Yellow flowers
            'fruiting_green': {'lower': [30, 40, 40], 'upper': [40, 255, 255]}, # Green fruits
            'fruiting_ripe': {'lower': [0, 50, 50], 'upper': [10, 255, 255]}   # Red fruits
        }
    
    def analyze_image(self, image_data):
        """Analyze uploaded image to detect tomato growth stage"""
        try:
            # Convert base64 to image
            if isinstance(image_data, str) and image_data.startswith('data:image'):
                image_data = image_data.split(',')[1]
            
            image_bytes = base64.b64decode(image_data)
            image = Image.open(io.BytesIO(image_bytes))
            opencv_image = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
            
            # Convert to HSV for better color analysis
            hsv = cv2.cvtColor(opencv_image, cv2.COLOR_BGR2HSV)
            
            # Analyze different color components
            stage_scores = self.analyze_colors(hsv)
            detected_stage = self.determine_stage(stage_scores)
            
            # Additional analysis
            plant_size = self.estimate_plant_size(opencv_image)
            health_score = self.assess_plant_health(opencv_image)
            
            return {
                'detected_stage': detected_stage,
                'confidence': stage_scores[detected_stage],
                'stage_info': self.stages[detected_stage],
                'plant_size': plant_size,
                'health_score': health_score,
                'analysis_details': stage_scores
            }
            
        except Exception as e:
            return {'error': f'Image analysis failed: {str(e)}'}
    
    def analyze_colors(self, hsv_image):
        """Analyze color distribution to determine growth stage"""
        scores = {}
        
        for stage, colors in self.color_ranges.items():
            lower = np.array(colors['lower'])
            upper = np.array(colors['upper'])
            mask = cv2.inRange(hsv_image, lower, upper)
            percentage = np.sum(mask > 0) / (hsv_image.shape[0] * hsv_image.shape[1])
            scores[stage] = percentage * 100
        
        return scores
    
    def determine_stage(self, scores):
        """Determine growth stage based on color analysis"""
        # Rule-based decision making
        if scores.get('fruiting_ripe', 0) > 5:
            return 'harvest'
        elif scores.get('fruiting_green', 0) > 8:
            return 'fruiting'
        elif scores.get('flowering', 0) > 3:
            return 'flowering'
        elif scores.get('vegetative', 0) > 15:
            return 'vegetative'
        elif scores.get('seedling', 0) > 10:
            return 'seedling'
        else:
            return 'germination'
    
    def estimate_plant_size(self, image):
        """Estimate plant size from image"""
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        _, thresh = cv2.threshold(gray, 50, 255, cv2.THRESH_BINARY)
        
        # Find contours
        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        if contours:
            largest_contour = max(contours, key=cv2.contourArea)
            area = cv2.contourArea(largest_contour)
            # Normalize area to 0-100 scale
            normalized_area = min(100, (area / (image.shape[0] * image.shape[1])) * 1000)
            return normalized_area
        
        return 0
    
    def assess_plant_health(self, image):
        """Basic plant health assessment"""
        hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
        
        # Healthy green detection
        green_lower = np.array([30, 40, 40])
        green_upper = np.array([40, 255, 255])
        green_mask = cv2.inRange(hsv, green_lower, green_upper)
        
        # Yellow/brown (unhealthy) detection
        unhealthy_lower = np.array([15, 30, 30])
        unhealthy_upper = np.array([25, 255, 255])
        unhealthy_mask = cv2.inRange(hsv, unhealthy_lower, unhealthy_upper)
        
        total_plant_pixels = np.sum(green_mask > 0) + np.sum(unhealthy_mask > 0)
        
        if total_plant_pixels > 0:
            health_ratio = np.sum(green_mask > 0) / total_plant_pixels
            return health_ratio * 100
        
        return 50  # Default score if no plant detected