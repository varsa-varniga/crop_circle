# task_predictor.py - Advanced Farming Task Predictor
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
import pandas as pd
import joblib
import os
from datetime import datetime

class AdvancedFarmingTaskPredictor:
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.is_trained = False
        
        # Feature names for better interpretation
        self.features = ['crop_age', 'temperature', 'humidity', 'rainfall', 'soil_moisture', 'season']
        
        # Task types with descriptions
        self.task_descriptions = {
            'irrigation': "Water plants based on soil moisture and weather",
            'fertilizer': "Apply nutrients for optimal growth", 
            'pest_control': "Prevent and treat pest infestations",
            'harvest': "Harvest mature crops",
            'pruning': "Trim plants for better growth",
            'weeding': "Remove competing weeds",
            'soil_testing': "Check soil health and nutrients",
            'general_care': "Routine maintenance and observation"
        }
        
        # Crop-specific knowledge
        self.crop_knowledge = {
            'tomato': {
                'stages': {
                    'germination': (1, 10),
                    'vegetative': (11, 35),
                    'flowering': (36, 55),
                    'fruiting': (56, 85),
                    'harvest': (86, 100)
                },
                'optimal_temp': (20, 30),
                'water_needs': 'medium'
            },
            'rice': {
                'stages': {
                    'seedling': (1, 25),
                    'tillering': (26, 55),
                    'flowering': (56, 85),
                    'ripening': (86, 115)
                },
                'optimal_temp': (20, 35),
                'water_needs': 'high'
            }
        }
        
        # Initialize with sample training data
        self.initialize_training_data()
    
    def initialize_training_data(self):
        """Create initial training data based on farming best practices"""
        # [crop_age, temperature, humidity, rainfall, soil_moisture, season]
        self.X_train = np.array([
            # Early stage (1-20 days)
            [5, 25, 70, 2, 45, 1],   # irrigation
            [10, 26, 65, 0, 35, 1],  # irrigation  
            [15, 28, 60, 1, 30, 1],  # irrigation
            [8, 24, 75, 5, 60, 1],   # drainage_check
            [12, 22, 80, 8, 65, 1],  # drainage_check
            
            # Vegetative stage (21-40 days)
            [25, 28, 65, 0, 40, 2],  # fertilizer
            [30, 30, 60, 0, 38, 2],  # fertilizer
            [35, 32, 55, 0, 35, 2],  # pest_control
            [28, 29, 58, 1, 42, 2],  # weeding
            [32, 31, 53, 0, 37, 2],  # weeding
            
            # Flowering/Fruiting stage (41-70 days)
            [45, 28, 60, 0, 42, 2],  # pest_control
            [50, 26, 65, 1, 45, 2],  # fertilizer
            [55, 27, 62, 0, 43, 3],  # pest_control
            [60, 25, 68, 2, 48, 3],  # general_care
            [65, 24, 70, 1, 46, 3],  # general_care
            
            # Harvest stage (71-100+ days)
            [75, 26, 55, 0, 35, 3],  # harvest
            [80, 28, 50, 0, 30, 4],  # harvest
            [85, 22, 60, 1, 40, 4],  # soil_testing
            [90, 24, 58, 0, 38, 4],  # soil_testing
            [95, 26, 52, 0, 32, 4],  # pruning
            
            # Extreme weather conditions
            [20, 35, 45, 0, 28, 2],  # shade_management (high temp)
            [40, 18, 85, 15, 70, 1], # drainage_check (heavy rain)
            [60, 38, 40, 0, 25, 2],  # irrigation (heat wave)
            [30, 15, 75, 2, 45, 4],  # frost_protection (cold),
        ])
        
        # Corresponding tasks for training data
        self.y_train = np.array([
            'irrigation', 'irrigation', 'irrigation', 'drainage_check', 'drainage_check',
            'fertilizer', 'fertilizer', 'pest_control', 'weeding', 'weeding',
            'pest_control', 'fertilizer', 'pest_control', 'general_care', 'general_care',
            'harvest', 'harvest', 'soil_testing', 'soil_testing', 'pruning',
            'shade_management', 'drainage_check', 'irrigation', 'frost_protection'
        ])
    
    def train_model(self):
        """Train the Random Forest model"""
        try:
            # Scale the features
            X_scaled = self.scaler.fit_transform(self.X_train)
            
            # Create and train Random Forest classifier
            self.model = RandomForestClassifier(
                n_estimators=100,
                max_depth=10,
                random_state=42
            )
            
            self.model.fit(X_scaled, self.y_train)
            self.is_trained = True
            
            # Calculate training accuracy
            train_accuracy = self.model.score(X_scaled, self.y_train)
            print(f"✅ Model trained successfully! Training accuracy: {train_accuracy:.2f}")
            
            return True
            
        except Exception as e:
            print(f"❌ Error training model: {e}")
            return False
    
    def predict_tasks(self, crop_age, temperature, humidity, rainfall, soil_moisture, season):
        """Predict farming tasks based on current conditions"""
        if not self.is_trained:
            print("⚠️ Model not trained. Training now...")
            if not self.train_model():
                return self.fallback_prediction(crop_age, temperature, humidity, rainfall, soil_moisture, season)
        
        try:
            # Prepare input features
            input_features = np.array([[crop_age, temperature, humidity, rainfall, soil_moisture, season]])
            
            # Scale features
            input_scaled = self.scaler.transform(input_features)
            
            # Make prediction
            prediction = self.model.predict(input_scaled)[0]
            probabilities = self.model.predict_proba(input_scaled)[0]
            
            # Get top 3 predictions
            class_indices = np.argsort(probabilities)[-3:][::-1]
            top_tasks = [self.model.classes_[i] for i in class_indices]
            top_probabilities = [probabilities[i] for i in class_indices]
            
            # Apply expert rules for final decision
            final_recommendation = self.apply_expert_rules(
                prediction, crop_age, temperature, humidity, rainfall, soil_moisture
            )
            
            return {
                'recommended_task': final_recommendation,
                'confidence': round(max(probabilities) * 100, 1),
                'alternative_tasks': [
                    {'task': task, 'confidence': round(prob * 100, 1)}
                    for task, prob in zip(top_tasks, top_probabilities)
                ],
                'all_predictions': dict(zip(self.model.classes_, probabilities)),
                'current_conditions': {
                    'crop_age': crop_age,
                    'temperature': temperature,
                    'humidity': humidity,
                    'rainfall': rainfall,
                    'soil_moisture': soil_moisture,
                    'season': season
                }
            }
            
        except Exception as e:
            print(f"❌ Prediction error: {e}")
            return self.fallback_prediction(crop_age, temperature, humidity, rainfall, soil_moisture, season)
    
    def apply_expert_rules(self, ml_prediction, crop_age, temp, humidity, rain, soil_moisture):
        """Apply farming expert rules to refine ML prediction"""
        # Rule 1: If heavy rain predicted, prioritize drainage
        if rain > 10:
            return 'drainage_check'
        
        # Rule 2: If soil moisture very low, prioritize irrigation
        if soil_moisture < 25:
            return 'irrigation'
        
        # Rule 3: If soil moisture very high, avoid irrigation
        if soil_moisture > 70 and ml_prediction == 'irrigation':
            return 'drainage_check'
        
        # Rule 4: If temperature extreme, adjust tasks
        if temp > 35:
            return 'shade_management'
        elif temp < 10:
            return 'frost_protection'
        
        # Rule 5: Growth stage based adjustments
        if 40 <= crop_age <= 60:  # Flowering stage
            if ml_prediction in ['irrigation', 'fertilizer']:
                return 'pest_control'  # Pests common during flowering
        
        return ml_prediction
    
    def fallback_prediction(self, crop_age, temperature, humidity, rainfall, soil_moisture, season):
        """Fallback rule-based prediction if ML fails"""
        # Simple rule-based system
        if soil_moisture < 30:
            task = 'irrigation'
        elif rainfall > 8:
            task = 'drainage_check'
        elif 25 <= crop_age <= 40:
            task = 'fertilizer'
        elif 40 <= crop_age <= 70:
            task = 'pest_control'
        elif crop_age > 70:
            task = 'harvest'
        else:
            task = 'general_care'
        
        return {
            'recommended_task': task,
            'confidence': 75.0,  # Lower confidence for rule-based
            'alternative_tasks': [
                {'task': 'general_care', 'confidence': 25.0}
            ],
            'all_predictions': {task: 0.75, 'general_care': 0.25},
            'current_conditions': {
                'crop_age': crop_age,
                'temperature': temperature,
                'humidity': humidity,
                'rainfall': rainfall,
                'soil_moisture': soil_moisture,
                'season': season
            },
            'note': 'Using rule-based fallback system'
        }
    
    def get_season_from_date(self, date=None):
        """Convert date to season (1=spring, 2=summer, 3=autumn, 4=winter)"""
        if date is None:
            date = datetime.now()
        
        month = date.month
        if 3 <= month <= 5:
            return 1  # spring
        elif 6 <= month <= 8:
            return 2  # summer
        elif 9 <= month <= 11:
            return 3  # autumn
        else:
            return 4  # winter
    
    def get_task_description(self, task):
        """Get detailed description for a task"""
        return self.task_descriptions.get(task, "General farming activity")
    
    def save_model(self, filepath='farming_model.joblib'):
        """Save trained model to file"""
        if self.is_trained:
            joblib.dump({
                'model': self.model,
                'scaler': self.scaler,
                'features': self.features
            }, filepath)
            print(f"✅ Model saved to {filepath}")
    
    def load_model(self, filepath='farming_model.joblib'):
        """Load trained model from file"""
        try:
            if os.path.exists(filepath):
                loaded = joblib.load(filepath)
                self.model = loaded['model']
                self.scaler = loaded['scaler']
                self.features = loaded['features']
                self.is_trained = True
                print(f"✅ Model loaded from {filepath}")
                return True
        except Exception as e:
            print(f"❌ Error loading model: {e}")
        return False

def predict_from_json(json_data):
    """Make prediction from JSON input for API calls"""
    predictor = AdvancedFarmingTaskPredictor()
    
    # Try to load saved model first
    if not predictor.load_model():
        print("Training new model...")
        predictor.train_model()
    
    # Extract parameters
    crop_age = json_data.get('crop_age', 30)
    temperature = json_data.get('temperature', 25)
    humidity = json_data.get('humidity', 60)
    rainfall = json_data.get('rainfall', 0)
    soil_moisture = json_data.get('soil_moisture', 40)
    season = json_data.get('season', 2)
    
    # Make prediction
    result = predictor.predict_tasks(crop_age, temperature, humidity, rainfall, soil_moisture, season)
    
    # Format response for API
    response = {
        'success': True,
        'tasks': [
            {
                'task': result['recommended_task'],
                'confidence': result['confidence'],
                'reason': f"AI recommended based on current conditions ({result['confidence']}% confidence)"
            }
        ],
        'overall_confidence': result['confidence'],
        'alternative_tasks': [alt['task'] for alt in result['alternative_tasks'][:2]],
        'current_conditions': result['current_conditions']
    }
    
    # Add alternative tasks as separate recommendations
    for alt_task in result['alternative_tasks'][:2]:
        if alt_task['task'] != result['recommended_task']:
            response['tasks'].append({
                'task': alt_task['task'],
                'confidence': alt_task['confidence'],
                'reason': f"Alternative AI suggestion ({alt_task['confidence']}% confidence)"
            })
    
    return response

# Command line interface for API calls
# Add this improved command line handling to your task_predictor.py
if __name__ == "__main__":
    import sys
    import json
    
    if len(sys.argv) > 2 and sys.argv[1] == '--predict':
        try:
            # Debug: Print what we received
            print(f"Debug: Number of args: {len(sys.argv)}", file=sys.stderr)
            for i, arg in enumerate(sys.argv):
                print(f"Debug: arg[{i}]: {arg}", file=sys.stderr)
            
            # The JSON might be split across multiple arguments, join them
            json_parts = sys.argv[2:]
            json_str = ' '.join(json_parts)
            print(f"Debug: Combined JSON string: {json_str}", file=sys.stderr)
            
            # Clean the string - remove any extra quotes or escaping
            json_str = json_str.strip()
            
            # Handle the case where the JSON might be wrapped in extra quotes
            if json_str.startswith('"') and json_str.endswith('"'):
                json_str = json_str[1:-1]
            
            # Unescape any escaped characters
            json_str = json_str.replace('\\"', '"')
            
            print(f"Debug: Cleaned JSON string: {json_str}", file=sys.stderr)
            
            # Parse JSON input
            input_data = json.loads(json_str)
            print(f"Debug: Successfully parsed JSON: {input_data}", file=sys.stderr)
            
            result = predict_from_json(input_data)
            print(json.dumps(result))
            
        except json.JSONDecodeError as e:
            print(f"Debug: JSON decode error: {e}", file=sys.stderr)
            print(f"Debug: Problematic JSON: {json_str}", file=sys.stderr)
            error_result = {
                'success': False,
                'error': f'JSON parsing failed: {str(e)}',
                'received_args': sys.argv[2:] if len(sys.argv) > 2 else [],
                'tasks': [],
                'overall_confidence': 0
            }
            print(json.dumps(error_result))
        except Exception as e:
            print(f"Debug: General error: {e}", file=sys.stderr)
            import traceback
            traceback.print_exc(file=sys.stderr)
            error_result = {
                'success': False,
                'error': str(e),
                'tasks': [],
                'overall_confidence': 0
            }
            print(json.dumps(error_result))
    else:
        # Original training and testing code
        print("🌾 Smart Farming AI Task Predictor")
        print("=" * 50)
        
        predictor = AdvancedFarmingTaskPredictor()
        predictor.train_model()
        
        # ... rest of your original testing code ...
        
        # Test predictions
        test_cases = [
            (25, 28, 65, 0, 35, 2),  # Vegetative stage, normal conditions
            (45, 30, 60, 0, 40, 2),  # Flowering stage
            (75, 26, 55, 0, 30, 3),  # Harvest stage
            (20, 35, 45, 0, 25, 2),  # Hot and dry
            (30, 20, 80, 12, 65, 1), # Rainy conditions
        ]
        
        print("\n🧪 Testing Predictions:")
        print("-" * 50)
        
        for i, (age, temp, hum, rain, soil, season) in enumerate(test_cases, 1):
            result = predictor.predict_tasks(age, temp, hum, rain, soil, season)
            
            print(f"\nTest Case {i}:")
            print(f"  Conditions: {age} days, {temp}°C, {hum}% humidity, {rain}mm rain, {soil}% soil moisture")
            print(f"  🤖 AI Recommendation: {result['recommended_task']} ({result['confidence']}% confidence)")
            print(f"  📝 Description: {predictor.get_task_description(result['recommended_task'])}")
            
            if result['alternative_tasks']:
                print(f"  🔄 Alternatives: {', '.join([alt['task'] for alt in result['alternative_tasks'][:2]])}")
        
        predictor.save_model()
        
        print("\n" + "=" * 50)
        print("✅ Farming AI Ready for Integration!")
        print("Use predictor.predict_tasks(age, temp, humidity, rain, soil_moisture, season)")
        print("to get smart farming recommendations! 🌱")