import numpy as np
import random

class AdvancedFarmingTaskPredictor:
    def __init__(self):
        self.task_config = {
            'irrigation': {'priority': 1, 'duration': 2},
            'fertilizer': {'priority': 2, 'duration': 1},
            'pest_control': {'priority': 1, 'duration': 1},
            'harvest': {'priority': 1, 'duration': 3},
            'pruning': {'priority': 3, 'duration': 2},
            'weeding': {'priority': 2, 'duration': 2},
            'general_care': {'priority': 4, 'duration': 1},
        }
    
    def predict_with_reinforcement(self, conditions, pending_tasks):
        """Simple prediction for demo"""
        if len(conditions) < 6:
            return "general_care"
            
        crop_age, temp, humidity, rain, soil_moisture, season = conditions
        
        if soil_moisture < 30:
            return "irrigation"
        elif rain > 10:
            return "drainage_check"
        elif 20 <= crop_age <= 40:
            return "fertilizer"
        elif crop_age >= 70:
            return "harvest"
        else:
            return "general_care"
    
    def rule_based_predictor(self, features):
        """Rule-based fallback"""
        if len(features) < 6:
            return "general_care"
            
        crop_age, temp, humidity, rain, soil_moisture, season = features
        
        if soil_moisture < 25:
            return 'irrigation'
        elif rain > 10:
            return 'drainage_check'
        elif 20 <= crop_age <= 35:
            return 'fertilizer'
        elif 35 <= crop_age <= 55:
            return 'pest_control'
        elif crop_age >= 70:
            return 'harvest'
        elif soil_moisture > 70:
            return 'drainage_check'
        else:
            return 'general_care'

class DailyTaskManager:
    def __init__(self, predictor):
        self.predictor = predictor
        self.pending_tasks = []