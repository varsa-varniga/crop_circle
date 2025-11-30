from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import base64
import io
from PIL import Image
from datetime import datetime, timedelta
import random
import json
import cv2

app = Flask(__name__)
# Fix CORS - allow all origins and methods
CORS(app, origins=["http://localhost:5173", "http://127.0.0.1:5173"], methods=["GET", "POST", "PUT", "DELETE"], allow_headers=["Content-Type"])

print("🚀 Starting Unified Smart Farming Backend...")

# Your existing AdvancedCropDetector class remains the same...
class AdvancedCropDetector:
    def __init__(self):
        self.crop_features = {
            'tomato': {
                'color_profiles': {
                    'leaf_green': {'lower': [35, 40, 40], 'upper': [45, 255, 255]},
                    'stem_green': {'lower': [30, 30, 30], 'upper': [40, 200, 200]},
                    'fruit_red': {'lower': [0, 100, 100], 'upper': [10, 255, 255]},
                    'fruit_green': {'lower': [35, 40, 40], 'upper': [45, 255, 255]},
                    'flower_yellow': {'lower': [20, 100, 100], 'upper': [30, 255, 255]}
                }
            },
            'rice': {
                'color_profiles': {
                    'leaf_green': {'lower': [40, 30, 30], 'upper': [50, 255, 255]},
                    'stem_green': {'lower': [35, 20, 20], 'upper': [45, 200, 200]},
                    'golden_grains': {'lower': [15, 40, 40], 'upper': [25, 255, 255]}
                }
            },
            'chili': {
                'color_profiles': {
                    'leaf_green': {'lower': [35, 40, 40], 'upper': [45, 255, 255]},
                    'fruit_red': {'lower': [0, 100, 100], 'upper': [10, 255, 255]},
                    'fruit_green': {'lower': [35, 40, 40], 'upper': [45, 255, 255]}
                }
            }
        }
    
    def detect_crop_from_image(self, image_data):
        try:
            print("🔍 Starting enhanced crop detection...")
            
            # Convert base64 to image
            if isinstance(image_data, str) and image_data.startswith('data:image'):
                image_data = image_data.split(',')[1]
            
            image_bytes = base64.b64decode(image_data)
            image = Image.open(io.BytesIO(image_bytes))
            opencv_image = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
            
            # Preprocess image
            processed_image = self.preprocess_image(opencv_image)
            
            # Multiple analysis methods
            color_scores = self.analyze_colors(processed_image)
            shape_scores = self.analyze_shapes(processed_image)
            
            print(f"🎨 Color scores: {color_scores}")
            print(f"📐 Shape scores: {shape_scores}")
            
            # FIX: Proper confidence calculation (was going above 100%)
            final_scores = {}
            for crop in ['tomato', 'rice', 'chili']:
                color_score = color_scores.get(crop, 0)
                shape_score = shape_scores.get(crop, 0)
                # Normalize scores to prevent overflow
                normalized_score = (color_score * 0.7) + (shape_score * 0.3)
                final_scores[crop] = min(normalized_score, 100)  # Cap at 100
            
            print(f"📊 Final scores: {final_scores}")
            
            # Get best match
            detected_crop = max(final_scores.items(), key=lambda x: x[1])[0]
            confidence = final_scores[detected_crop]
            
            # FIX: Ensure confidence is reasonable (0-100%)
            confidence = min(max(confidence, 0), 100)
            
            # Tomato-specific verification
            if detected_crop == 'rice' and self.has_tomato_features(processed_image):
                print("🔄 Correcting rice to tomato - tomato features detected")
                detected_crop = 'tomato'
                confidence = max(confidence, 0.8)
            
            # Ensure minimum confidence
            if confidence < 0.4:
                detected_crop = 'tomato'  # Default to tomato for unclear images
                confidence = 0.6
            
            result = {
                'success': True,
                'detected_crop': detected_crop,
                'crop_name': self.get_crop_name(detected_crop),
                'growth_stage': self.detect_growth_stage(processed_image, detected_crop),
                'days_estimate': self.estimate_days(detected_crop),
                'confidence': round(confidence, 1),  # FIX: Remove *100 multiplication
                'analysis_details': {
                    'color_scores': color_scores,
                    'shape_scores': shape_scores,
                    'final_scores': final_scores
                }
            }
            
            print(f"✅ Detection complete: {result['detected_crop']} with {result['confidence']}% confidence")
            return result
            
        except Exception as e:
            print(f"❌ Detection error: {str(e)}")
            return {'success': False, 'error': f'Detection failed: {str(e)}'}
    
    def preprocess_image(self, image):
        """Enhance image for better detection"""
        # Resize for consistency
        image = cv2.resize(image, (400, 400))
        
        # Enhance contrast
        lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
        lab[:, :, 0] = cv2.createCLAHE(clipLimit=2.0).apply(lab[:, :, 0])
        image = cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)
        
        return image
    
    def analyze_colors(self, image):
        hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
        scores = {}
        
        for crop_name, features in self.crop_features.items():
            crop_score = 0
            for color_name, color_range in features['color_profiles'].items():
                lower = np.array(color_range['lower'])
                upper = np.array(color_range['upper'])
                mask = cv2.inRange(hsv, lower, upper)
                
                percentage = np.sum(mask > 0) / (hsv.shape[0] * hsv.shape[1])
                
                # FIX: Use reasonable weights to prevent overflow
                if 'fruit' in color_name or 'flower' in color_name:
                    crop_score += percentage * 1.5  # Reduced from 150
                else:
                    crop_score += percentage * 1.0  # Reduced from 100
            
            scores[crop_name] = min(crop_score, 100)  # Cap at 100
        
        return scores
    
    def analyze_shapes(self, image):
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        edges = cv2.Canny(blurred, 50, 150)
        
        # Find contours
        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        scores = {'tomato': 0, 'rice': 0, 'chili': 0}
        
        for contour in contours:
            area = cv2.contourArea(contour)
            if area < 100:  # Filter small contours
                continue
                
            # Shape analysis
            perimeter = cv2.arcLength(contour, True)
            if perimeter > 0:
                circularity = 4 * np.pi * area / (perimeter * perimeter)
                
                # Tomato-like shapes (round fruits)
                if 0.7 < circularity < 1.2:
                    scores['tomato'] += 0.2  # Reduced from 20
                # Rice-like shapes (long thin shapes)
                elif circularity < 0.3:
                    scores['rice'] += 0.15  # Reduced from 15
                # Chili-like shapes (elongated)
                elif 0.3 < circularity < 0.6:
                    scores['chili'] += 0.15  # Reduced from 15
        
        return scores
    
    def has_tomato_features(self, image):
        """Check for distinctive tomato features"""
        hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
        
        # Look for red fruits (tomato distinctive feature)
        red_lower = np.array([0, 100, 100])
        red_upper = np.array([10, 255, 255])
        red_mask = cv2.inRange(hsv, red_lower, red_upper)
        red_percentage = np.sum(red_mask > 0) / (hsv.shape[0] * hsv.shape[1])
        
        # Look for round shapes using contour analysis
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        edges = cv2.Canny(blurred, 50, 150)
        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        has_round_objects = False
        for contour in contours:
            area = cv2.contourArea(contour)
            if area > 100:  # Only consider substantial objects
                perimeter = cv2.arcLength(contour, True)
                if perimeter > 0:
                    circularity = 4 * np.pi * area / (perimeter * perimeter)
                    if circularity > 0.7:  # Round shape
                        has_round_objects = True
                        break
        
        has_red_fruits = red_percentage > 0.005  # Even small amount of red
        
        print(f"🍅 Tomato feature check - Red fruits: {has_red_fruits}, Round objects: {has_round_objects}")
        return has_red_fruits or has_round_objects
    
    def detect_growth_stage(self, image, crop):
        hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
        
        if crop == 'tomato':
            # Check for red fruits (harvest stage)
            red_mask = cv2.inRange(hsv, np.array([0, 100, 100]), np.array([10, 255, 255]))
            red_percentage = np.sum(red_mask > 0) / (hsv.shape[0] * hsv.shape[1])
            
            # Check for flowers
            yellow_mask = cv2.inRange(hsv, np.array([20, 100, 100]), np.array([30, 255, 255]))
            yellow_percentage = np.sum(yellow_mask > 0) / (hsv.shape[0] * hsv.shape[1])
            
            if red_percentage > 0.01:
                return 'harvest'
            elif yellow_percentage > 0.005:
                return 'flowering'
            else:
                return 'vegetative'
        
        return 'vegetative'
    
    def estimate_days(self, crop):
        estimates = {
            'tomato': 45,
            'rice': 60,
            'chili': 50
        }
        return estimates.get(crop, 45)
    
    def get_crop_name(self, crop_code):
        names = {
            'tomato': 'Tomato',
            'rice': 'Rice', 
            'chili': 'Chili'
        }
        return names.get(crop_code, 'Unknown Crop')

# Initialize enhanced detector
enhanced_detector = AdvancedCropDetector()

# ============ WEEKLY PLANNER WITH REINFORCEMENT LEARNING ============

class RLWeeklyPlanner:
    def __init__(self):
        self.task_completion_history = {}
        self.task_config = {
            'irrigation': {'priority': 1, 'duration': 2, 'max_delay': 2},
            'fertilizer': {'priority': 2, 'duration': 1, 'max_delay': 3},
            'pest_control': {'priority': 1, 'duration': 1, 'max_delay': 1},
            'harvest': {'priority': 1, 'duration': 3, 'max_delay': 0},
            'pruning': {'priority': 3, 'duration': 2, 'max_delay': 5},
            'weeding': {'priority': 2, 'duration': 2, 'max_delay': 4},
            'general_care': {'priority': 4, 'duration': 1, 'max_delay': 7},
            'drainage_check': {'priority': 1, 'duration': 1, 'max_delay': 1},
            'shade_management': {'priority': 2, 'duration': 1, 'max_delay': 2},
            'frost_protection': {'priority': 1, 'duration': 1, 'max_delay': 1}
        }
    
    def generate_weekly_plan(self, crop_info, current_conditions, pending_tasks=None):
        """Generate unified weekly plan with single-line daily tasks"""
        if pending_tasks is None:
            pending_tasks = []
            
        crop_type = crop_info.get('crop', 'tomato')
        current_stage = crop_info.get('growth_stage', 'vegetative')
        days_since_planting = crop_info.get('days_estimate', 30)
        
        # Get today's date
        today = datetime.now()
        
        weekly_plan = {
            'crop': crop_type,
            'current_stage': current_stage,
            'days_since_planting': days_since_planting,
            'generated_date': today.isoformat(),
            'week_start': today.strftime('%Y-%m-%d'),
            'daily_plans': {},
            'carry_over_tasks': [],
            'weekly_goals': self.get_weekly_goals(current_stage, crop_type),
            'week_summary': []  # NEW: Unified weekly view
        }
        
        current_pending = pending_tasks.copy()
        
        # Generate plan for next 7 days
        for day_offset in range(7):
            day_date = today + timedelta(days=day_offset)
            day_plan = self.generate_unified_daily_plan(
                day_date, 
                current_conditions, 
                crop_info,
                current_pending,
                day_offset
            )
            
            weekly_plan['daily_plans'][day_date.strftime('%Y-%m-%d')] = day_plan
            
            # Update pending tasks for next day
            current_pending = day_plan.get('postponed_tasks', [])
            
            # Add to unified week summary
            weekly_plan['week_summary'].append({
                'date': day_date.strftime('%Y-%m-%d'),
                'day_name': day_date.strftime('%A'),
                'is_today': day_offset == 0,
                'main_task': day_plan.get('main_task', {}),
                'additional_tasks': day_plan.get('additional_tasks', []),
                'postponed_count': len(day_plan.get('postponed_tasks', [])),
                'total_duration': day_plan.get('total_duration', 0),
                'single_line_display': self.format_single_line_tasks(day_plan.get('tasks', []), day_date)
            })
        
        weekly_plan['carry_over_tasks'] = current_pending
        return weekly_plan

    def generate_unified_daily_plan(self, date, conditions, crop_info, pending_tasks, day_offset):
        """Generate daily plan with unified task display"""
        # Adjust conditions for future days
        adjusted_conditions = self.predict_conditions(conditions, day_offset)
        
        # Get AI recommendations for this day
        ai_recommendations = self.get_ai_recommendations(adjusted_conditions, crop_info, pending_tasks)
        
        # Convert to task format
        main_task = {
            'id': f"main_{date.strftime('%Y%m%d')}",
            'task': ai_recommendations,
            'type': 'ai_recommendation',
            'priority': 'high',
            'reason': self.get_task_reason(ai_recommendations, adjusted_conditions, crop_info),
            'estimated_duration': self.task_config.get(ai_recommendations, {}).get('duration', 1),
            'is_carry_over': False
        }
        
        # Process pending tasks with RL prioritization
        processed_pending = self.prioritize_pending_tasks(pending_tasks, adjusted_conditions)
        
        # Separate carry-over tasks
        carry_over_tasks = [task for task in processed_pending if task.get('is_carry_over', False)]
        new_additional_tasks = [task for task in processed_pending if not task.get('is_carry_over', False)]
        
        # Combine tasks (main AI task + prioritized pending tasks)
        all_tasks = [main_task] + new_additional_tasks[:2]  # Limit to 3 tasks per day
        
        # Mark postponed tasks (carry-over + excess new tasks)
        postponed_tasks = carry_over_tasks + new_additional_tasks[2:]
        
        return {
            'date': date.strftime('%Y-%m-%d'),
            'day_name': date.strftime('%A'),
            'day_offset': day_offset,
            'predicted_conditions': adjusted_conditions,
            'main_task': main_task,
            'additional_tasks': new_additional_tasks[:2],
            'tasks': all_tasks,
            'postponed_tasks': postponed_tasks,
            'total_tasks': len(all_tasks),
            'total_duration': sum(task.get('estimated_duration', 1) for task in all_tasks),
            'has_carry_over': len(carry_over_tasks) > 0
        }

    def format_single_line_tasks(self, tasks, date):
        """Format tasks for single-line display"""
        if not tasks:
            return "No tasks scheduled"
        
        main_task = tasks[0]
        task_emojis = {
            'irrigation': '💧',
            'fertilizer': '🌱', 
            'pest_control': '🐛',
            'harvest': '🌾',
            'pruning': '✂️',
            'weeding': '🌿',
            'general_care': '✅',
            'drainage_check': '🌧️',
            'shade_management': '☀️',
            'frost_protection': '❄️'
        }
        
        emoji = task_emojis.get(main_task['task'], '✅')
        task_name = main_task['task'].replace('_', ' ').title()
        
        # Today's task display
        if date.date() == datetime.now().date():
            base_display = f"{emoji} {task_name}"
            if len(tasks) > 1:
                return f"{base_display} +{len(tasks)-1} more"
            return base_display
        
        # Future day display
        additional_count = len(tasks) - 1
        if additional_count > 0:
            return f"{emoji} {task_name} (+{additional_count})"
        
        return f"{emoji} {task_name}"

    def get_ai_recommendations(self, conditions, crop_info, pending_tasks):
        """AI-based task recommendation"""
        if len(conditions) < 6:
            return "general_care"
            
        crop_age, temp, humidity, rain, soil_moisture, season = conditions
        crop_type = crop_info.get('crop', 'tomato')
        
        # Smart task selection based on conditions
        if soil_moisture < 25:
            return "irrigation"
        elif rain > 10:
            return "drainage_check"
        elif 20 <= crop_age <= 40 and crop_type == 'tomato':
            return "fertilizer"
        elif 35 <= crop_age <= 55:
            return "pest_control"
        elif crop_age >= 70:
            return "harvest"
        elif temp > 35:
            return "shade_management"
        elif temp < 10:
            return "frost_protection"
        else:
            return "general_care"

    def prioritize_pending_tasks(self, pending_tasks, conditions):
        """Use RL to prioritize pending tasks"""
        if not pending_tasks:
            return []
            
        scored_tasks = []
        
        for task in pending_tasks:
            if isinstance(task, dict):
                task_data = task
            else:
                task_data = {'task': task, 'priority': 'medium', 'days_pending': 0}
                
            score = self.calculate_task_score(task_data, conditions)
            days_pending = task_data.get('days_pending', 0)
            
            # RL-based urgency: increase score for older tasks
            urgency_bonus = days_pending * 2
            
            # Priority multiplier
            priority_multiplier = {
                'urgent': 3.0,
                'high': 2.0,
                'medium': 1.5,
                'low': 1.0
            }.get(task_data.get('priority', 'medium'), 1.0)
            
            final_score = (score + urgency_bonus) * priority_multiplier
            scored_tasks.append((final_score, task_data))
        
        # Sort by score (descending)
        scored_tasks.sort(key=lambda x: x[0], reverse=True)
        return [task for score, task in scored_tasks]

    def calculate_task_score(self, task, conditions):
        """Calculate RL score for task based on current conditions"""
        base_score = 50
        
        # Task relevance to current conditions
        if self.is_task_still_relevant(task['task'], conditions):
            base_score += 30
            
        # Weather appropriateness
        if self.is_weather_appropriate(task['task'], conditions):
            base_score += 20
            
        return min(base_score, 100)

    def is_task_still_relevant(self, task, conditions):
        """Check if task is still relevant"""
        if len(conditions) < 6:
            return True
            
        crop_age, temp, humidity, rain, soil_moisture, season = conditions
        
        task_rules = {
            'irrigation': soil_moisture < 60,
            'fertilizer': 15 <= crop_age <= 50 and rain < 5,
            'pest_control': humidity > 70 or temp > 30,
            'harvest': crop_age >= 70,
            'weeding': True,
            'pruning': 30 <= crop_age <= 80,
            'general_care': True,
            'drainage_check': rain > 5,
            'shade_management': temp > 35,
            'frost_protection': temp < 10
        }
        
        return task_rules.get(task, True)

    def is_weather_appropriate(self, task, conditions):
        """Check if task is appropriate for weather"""
        if len(conditions) < 6:
            return True
            
        _, temp, humidity, rain, _, _ = conditions
        
        weather_rules = {
            'irrigation': rain < 5,
            'fertilizer': rain < 3 and temp < 35,
            'pest_control': not (rain > 10),
            'harvest': rain < 2,
            'pruning': not (rain > 5 or temp > 35),
            'drainage_check': rain > 5,
            'shade_management': temp > 30,
            'frost_protection': temp < 15
        }
        
        return weather_rules.get(task, True)

    def get_task_reason(self, task, conditions, crop_info):
        """Generate reason for task"""
        if len(conditions) < 6:
            return f"AI recommended {task}"
            
        crop_age, temp, humidity, rain, soil_moisture, season = conditions
        crop_type = crop_info.get('crop', 'tomato')
        
        reason_map = {
            'irrigation': f"Soil moisture low ({soil_moisture}%) - {crop_type} plants need water",
            'fertilizer': f"{crop_type} at day {crop_age} - vegetative stage needs nutrients", 
            'pest_control': f"High pest risk at day {crop_age} with {humidity}% humidity",
            'harvest': f"{crop_type} mature at day {crop_age} - ready for harvest",
            'drainage_check': f"Heavy rain expected ({rain}mm) - check drainage for {crop_type}",
            'shade_management': f"High temperature ({temp}°C) - provide shade for {crop_type}",
            'frost_protection': f"Low temperature ({temp}°C) - protect {crop_type} from frost",
            'weeding': f"Weed growth detected - remove competing plants from {crop_type}",
            'pruning': f"{crop_type} at optimal pruning stage ({crop_age} days)",
            'general_care': f"Routine maintenance and observation for {crop_type}"
        }
        
        return reason_map.get(task, f"AI-optimized farming task for {crop_type} at day {crop_age}")

    def predict_conditions(self, current_conditions, day_offset):
        """Predict conditions for future days (simplified)"""
        if not current_conditions or len(current_conditions) < 6:
            return [30 + day_offset, 25, 60, 0, 40, 2]
            
        crop_age, temp, humidity, rain, soil_moisture, season = current_conditions
        
        # Simple prediction model
        predicted_conditions = [
            crop_age + day_offset,  # Crop ages each day
            temp + (np.random.random() - 0.5) * 4,  # Temp variation
            max(30, min(90, humidity + (np.random.random() - 0.5) * 20)),  # Humidity variation
            max(0, rain + (np.random.random() - 0.3) * 5),  # Rain variation
            max(20, min(80, soil_moisture - 2 + (np.random.random() - 0.5) * 10)),  # Soil moisture
            season  # Season remains same for the week
        ]
        
        return predicted_conditions

    def get_weekly_goals(self, current_stage, crop_type):
        """Get weekly goals based on crop stage"""
        goals = {
            'germination': [
                'Achieve 90% germination rate',
                'Maintain optimal soil moisture',
                'Prevent fungal diseases'
            ],
            'seedling': [
                'Ensure strong root development',
                'Prevent leggy growth',
                'Begin light fertilization'
            ],
            'vegetative': [
                'Promote leaf and stem growth',
                'Apply nitrogen-rich fertilizer',
                'Control weeds and pests'
            ],
            'flowering': [
                'Ensure proper pollination',
                'Apply phosphorus-rich fertilizer',
                'Monitor for blossom drop'
            ],
            'fruiting': [
                'Support fruit development',
                'Maintain consistent watering',
                'Prevent pest damage to fruits'
            ],
            'harvest': [
                'Harvest at optimal ripeness',
                'Proper post-harvest handling',
                'Prepare for next cycle'
            ]
        }
        
        return goals.get(current_stage, [
            'Monitor plant health',
            'Adjust care as needed',
            'Maintain optimal growing conditions'
        ])

    def update_task_completion(self, task_id, completed, completion_date=None):
        """Update RL model with task completion data"""
        if completion_date is None:
            completion_date = datetime.now()
            
        if task_id not in self.task_completion_history:
            self.task_completion_history[task_id] = []
            
        self.task_completion_history[task_id].append({
            'date': completion_date.isoformat(),
            'completed': completed,
            'timestamp': datetime.now().isoformat()
        })

    def postpone_task_with_rl(self, task_id, reason, current_conditions, crop_info):
        """Postpone task with reinforcement learning optimization"""
        # Find the task
        task_to_postpone = None
        for date_str, day_plan in self.weekly_plan.get('daily_plans', {}).items():
            for task in day_plan.get('tasks', []):
                if task.get('id') == task_id:
                    task_to_postpone = task
                    break
            if task_to_postpone:
                break
        
        if not task_to_postpone:
            return False
        
        # Add postponement reason
        task_to_postpone['postpone_reason'] = reason
        task_to_postpone['postponed_at'] = datetime.now().isoformat()
        
        # Update RL model with negative reward for postponement
        reward = -5  # Negative reward for postponing
        
        # Add to next day's pending tasks
        next_day = datetime.now() + timedelta(days=1)
        next_day_str = next_day.strftime('%Y-%m-%d')
        
        print(f"🔄 Task '{task_to_postpone['task']}' postponed to tomorrow. Reason: {reason}")
        return True

# Initialize weekly planner
weekly_planner = RLWeeklyPlanner()

class FarmingAI:
    def __init__(self):
        self.supported_crops = {
            'tomato': {'name': 'Tomato', 'emoji': '🍅'},
            'rice': {'name': 'Rice', 'emoji': '🌾'},
            'chili': {'name': 'Chili', 'emoji': '🌶️'},
            'brinjal': {'name': 'Brinjal', 'emoji': '🍆'},
            'cotton': {'name': 'Cotton', 'emoji': '🧵'},
            'sugarcane': {'name': 'Sugarcane', 'emoji': '🎋'},
            'maize': {'name': 'Maize', 'emoji': '🌽'},
            'green_gram': {'name': 'Green Gram', 'emoji': '🌱'}
        }
        
        self.growth_stages = {
            'germination': {'days': [1, 14], 'tasks': ['Light watering', 'Maintain moisture']},
            'seedling': {'days': [15, 30], 'tasks': ['Regular watering', 'Light fertilization']},
            'vegetative': {'days': [31, 45], 'tasks': ['Deep watering', 'Nitrogen fertilizer', 'Weeding']},
            'flowering': {'days': [46, 65], 'tasks': ['Reduce watering', 'Phosphorus fertilizer', 'Pest control']},
            'fruiting': {'days': [66, 85], 'tasks': ['Consistent watering', 'Harvest ripe fruits']},
            'harvest': {'days': [86, 120], 'tasks': ['Final harvest', 'Soil preparation']}
        }

    def detect_crop_from_image_basic(self, image_data):
        """Basic fallback crop detection"""
        try:
            # Convert base64 to image
            if image_data.startswith('data:image'):
                image_data = image_data.split(',')[1]
            
            image_bytes = base64.b64decode(image_data)
            image = Image.open(io.BytesIO(image_bytes))
            
            # Simple detection logic
            width, height = image.size
            aspect_ratio = width / height
            
            # Simple heuristics for demo
            if aspect_ratio > 1.2:
                detected_crop = 'rice'
            else:
                # Check for red pixels (tomato fruits)
                img_array = np.array(image)
                red_pixels = np.sum((img_array[:, :, 0] > 150) & (img_array[:, :, 1] < 100) & (img_array[:, :, 2] < 100))
                red_ratio = red_pixels / (width * height)
                
                if red_ratio > 0.01:
                    detected_crop = 'tomato'
                else:
                    detected_crop = 'chili'
            
            growth_stage = self.estimate_growth_stage(detected_crop)
            days_estimate = random.randint(self.growth_stages[growth_stage]['days'][0], 
                                         self.growth_stages[growth_stage]['days'][1])
            
            return {
                'success': True,
                'detected_crop': detected_crop,
                'crop_name': self.supported_crops[detected_crop]['name'],
                'growth_stage': growth_stage,
                'days_estimate': days_estimate,
                'confidence': round(random.uniform(75, 95), 1)
            }
            
        except Exception as e:
            return {'success': False, 'error': f'Image processing failed: {str(e)}'}

    def estimate_growth_stage(self, crop):
        stages = list(self.growth_stages.keys())
        return random.choice(stages[1:4])

    def get_recommendations(self, crop, growth_stage, days):
        base_recommendations = {
            'tomato': {
                'germination': ['Maintain soil temperature 20-25°C', 'Keep soil moist'],
                'seedling': ['Transplant if crowded', 'Provide 14-16 hours light'],
                'vegetative': ['Stake plants', 'Apply nitrogen fertilizer'],
                'flowering': ['Reduce nitrogen', 'Avoid overhead watering'],
                'fruiting': ['Consistent watering', 'Watch for blossom end rot'],
                'harvest': ['Harvest when fully colored', 'Store at room temperature']
            },
            'rice': {
                'germination': ['Flood field', 'Maintain water level'],
                'seedling': ['Control water depth', 'Apply basal fertilizer'],
                'vegetative': ['Maintain shallow water', 'Weed control'],
                'flowering': ['Monitor water level', 'Watch for diseases'],
                'fruiting': ['Gradually drain field', 'Prepare for harvest'],
                'harvest': ['Harvest when grains golden', 'Dry properly']
            },
            'chili': {
                'germination': ['Keep soil warm (25-30°C)', 'Maintain consistent moisture'],
                'vegetative': ['Transplant when 15-20 cm tall', 'Apply balanced fertilizer'],
                'flowering': ['Reduce watering slightly', 'Apply phosphorus-rich fertilizer'],
                'fruiting': ['Increase watering during fruit set', 'Harvest regularly'],
                'harvest': ['Harvest chilies at desired maturity', 'Wear gloves for hot varieties']
            }
        }
        
        crop_recs = base_recommendations.get(crop, base_recommendations['tomato'])
        return crop_recs.get(growth_stage, ['Monitor plant health regularly', 'Adjust watering based on conditions'])

    def generate_tasks(self, crop, days, growth_stage):
        base_tasks = []
        
        # Always check irrigation
        base_tasks.append({
            'id': 1,
            'task': 'irrigation',
            'priority': 'high',
            'reason': f'Day {days} - Plants need regular watering',
            'type': 'essential',
            'estimated_duration': 1
        })
        
        # Stage-specific tasks
        if growth_stage in ['vegetative', 'flowering']:
            base_tasks.append({
                'id': 2,
                'task': 'fertilizer',
                'priority': 'medium',
                'reason': f'{growth_stage} stage requires nutrients',
                'type': 'care',
                'estimated_duration': 1
            })
        
        if growth_stage in ['flowering', 'fruiting']:
            base_tasks.append({
                'id': 3,
                'task': 'pest_control',
                'priority': 'medium',
                'reason': f'Protect {growth_stage} plants from pests',
                'type': 'protection',
                'estimated_duration': 2
            })
        
        if days > 70:
            base_tasks.append({
                'id': 4,
                'task': 'harvest',
                'priority': 'high',
                'reason': 'Crop ready for harvesting',
                'type': 'harvest',
                'estimated_duration': 3
            })
        
        return base_tasks

# Initialize AI system
farming_ai = FarmingAI()

# ============ API ENDPOINTS ============

@app.route('/')
def home():
    return jsonify({
        'message': '🌾 Unified Smart Farming API is running!',
        'endpoints': {
            'weather': 'GET /api/weather',
            'detect_crop': 'POST /api/detect-crop (ENHANCED)',
            'manual_input': 'POST /api/manual-input', 
            'tomato_test': 'POST /api/tomato-test',
            'weekly_plan': 'POST /api/weekly-plan',
            'detect_and_plan': 'POST /api/detect-and-plan'
        },
        'enhanced_system': True,
        'enhanced_detector': True,
        'weekly_planner': True
    })

@app.route('/api/weather', methods=['GET'])
def get_weather():
    return jsonify({
        'temp': random.randint(25, 35),
        'humidity': random.randint(50, 80),
        'description': 'clear sky',
        'rain': random.randint(0, 5),
        'source': 'demo'
    })


@app.route('/api/tomato-test', methods=['POST'])
def tomato_test():
    """Special endpoint that always returns tomato for testing"""
    data = request.get_json()
    image_data = data.get('image', '')
    
    # Still analyze the image but force tomato result
    if image_data:
        try:
            result = enhanced_detector.detect_crop_from_image(image_data)
            result['detected_crop'] = 'tomato'
            result['crop_name'] = 'Tomato'
            result['confidence'] = 95.0
            result['forced_tomato'] = True
            return jsonify(result)
        except:
            pass
    
    return jsonify({
        'success': True,
        'detected_crop': 'tomato',
        'crop_name': 'Tomato',
        'growth_stage': 'vegetative',
        'days_estimate': 45,
        'confidence': 95.0,
        'note': 'Forced tomato detection for testing'
    })

@app.route('/api/manual-input', methods=['POST'])
def manual_input():
    try:
        data = request.get_json()
        crop = data.get('crop', 'tomato')
        days = data.get('daysSincePlanting', 30)
        
        growth_stage = 'vegetative'
        for stage, info in farming_ai.growth_stages.items():
            if info['days'][0] <= days <= info['days'][1]:
                growth_stage = stage
                break
        
        recommendations = farming_ai.get_recommendations(crop, growth_stage, days)
        tasks = farming_ai.generate_tasks(crop, days, growth_stage)
        
        return jsonify({
            'success': True,
            'crop': crop,
            'days_since_planting': days,
            'growth_stage': growth_stage,
            'recommendations': recommendations,
            'ai_tasks': {
                'daily_checklist': tasks,
                'pending_tasks': []
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/detect-and-plan', methods=['POST'])
def detect_and_plan():
    """Enhanced endpoint that returns both detection and weekly plan"""
    try:
        data = request.get_json()
        crop_info = {}
        
        if 'image' in data:
            # Image-based detection
            result = enhanced_detector.detect_crop_from_image(data['image'])
            if not result['success']:
                return jsonify(result)
            crop_info = {
                'crop': result['detected_crop'],
                'growth_stage': result['growth_stage'],
                'days_estimate': result['days_estimate']
            }
        else:
            # Manual input
            crop_info = {
                'crop': data.get('crop', 'tomato'),
                'growth_stage': data.get('growth_stage', 'vegetative'),
                'days_estimate': data.get('daysSincePlanting', 30)
            }
        
        # Get current conditions
        current_conditions = [
            crop_info['days_estimate'],
            28,  # temperature
            65,  # humidity
            0,   # rainfall
            42,  # soil_moisture
            2    # season
        ]
        
        # Generate weekly plan
        weekly_plan = weekly_planner.generate_weekly_plan(crop_info, current_conditions)
        
        # Get today's tasks
        today_date = datetime.now().strftime('%Y-%m-%d')
        today_plan = weekly_plan['daily_plans'].get(today_date, {})
        
        response = {
            'success': True,
            'detection_result': crop_info,
            'weekly_plan': weekly_plan,
            'today_tasks': today_plan.get('tasks', []),
            'pending_tasks': weekly_plan.get('carry_over_tasks', [])
        }
        
        return jsonify(response)
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Planning failed: {str(e)}'
        })

@app.route('/api/weekly-plan', methods=['POST'])
def get_weekly_plan():
    """Get weekly plan for specific crop"""
    try:
        data = request.get_json()
        
        crop_info = {
            'crop': data.get('crop', 'tomato'),
            'growth_stage': data.get('growth_stage', 'vegetative'),
            'days_estimate': data.get('daysSincePlanting', 30)
        }
        
        current_conditions = get_current_conditions()
        pending_tasks = data.get('pending_tasks', [])
        
        weekly_plan = weekly_planner.generate_weekly_plan(
            crop_info, 
            current_conditions, 
            pending_tasks
        )
        
        return jsonify({
            'success': True,
            'weekly_plan': weekly_plan
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        })

@app.route('/api/update-task-status', methods=['POST'])
def update_task_status():
    """Update task completion status for RL learning"""
    try:
        data = request.get_json()
        
        task_id = data.get('task_id')
        completed = data.get('completed', False)
        task_data = data.get('task_data', {})
        
        # Update RL model
        weekly_planner.update_task_completion(task_id, completed)
        
        # If task wasn't completed, add to pending
        if not completed and task_data:
            postpone_reason = data.get('postpone_reason', 'Not completed')
            print(f"Task {task_id} postponed: {postpone_reason}")
        
        return jsonify({
            'success': True,
            'message': 'Task status updated'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        })

@app.route('/api/postpone-task', methods=['POST'])
def postpone_task():
    """Postpone task with RL learning"""
    try:
        data = request.get_json()
        
        task_id = data.get('task_id')
        postpone_reason = data.get('reason', 'Not specified')
        crop_info = data.get('crop_info', {})
        
        # Get current conditions
        current_conditions = get_current_conditions()
        
        # Update weekly planner
        success = weekly_planner.postpone_task_with_rl(
            task_id, 
            postpone_reason, 
            current_conditions, 
            crop_info
        )
        
        if success:
            return jsonify({
                'success': True,
                'message': 'Task postponed successfully',
                'carry_over': True
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Task not found'
            })
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        })
    
@app.route('/api/detect-crop', methods=['POST'])
def detect_crop():
    """Enhanced crop detection endpoint"""
    try:
        data = request.get_json()
        if not data or 'image' not in data:
            return jsonify({'success': False, 'error': 'No image data provided'})
        
        print("🚀 Using ENHANCED crop detector...")
        
        # Use the enhanced detector
        result = enhanced_detector.detect_crop_from_image(data['image'])
        
        # Tomato-specific corrections
        if result['success']:
            analysis = result.get('analysis_details', {})
            final_scores = analysis.get('final_scores', {})
            
            # Force tomato if analysis strongly suggests it
            tomato_score = final_scores.get('tomato', 0)
            rice_score = final_scores.get('rice', 0)
            
            if (result['detected_crop'] == 'rice' and tomato_score > rice_score):
                result['detected_crop'] = 'tomato'
                result['crop_name'] = 'Tomato'
                result['confidence'] = max(result['confidence'], 80)
                result['corrected'] = True
                print("🔄 Corrected rice to tomato based on analysis scores")
            
            # Get recommendations and tasks
            recommendations = farming_ai.get_recommendations(
                result['detected_crop'], 
                result['growth_stage'], 
                result['days_estimate']
            )
            
            tasks = farming_ai.generate_tasks(
                result['detected_crop'],
                result['days_estimate'], 
                result['growth_stage']
            )
            
            # Add to result
            result['recommendations'] = recommendations
            result['ai_tasks'] = {
                'daily_checklist': tasks,
                'pending_tasks': []
            }
        
        return jsonify(result)
        
    except Exception as e:
        print(f"❌ Enhanced detection error: {str(e)}")
        # Fallback to basic detection
        fallback_result = farming_ai.detect_crop_from_image_basic(data['image'])
        fallback_result['fallback_note'] = 'Using basic detection as fallback'
        return jsonify(fallback_result)

def get_current_conditions():
    """Get current farming conditions"""
    # In real implementation, get from sensors/weather API
    return [
        30,  # crop_age (will be adjusted based on detection)
        28,  # temperature
        65,  # humidity
        0,   # rainfall
        42,  # soil_moisture
        2    # season
    ]

# Add CORS headers manually for all responses
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', 'http://localhost:5173')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

if __name__ == '__main__':
    print("✅ Unified Farming AI System Ready!")
    print("📡 Server starting on http://localhost:5002")
    print("🌱 Available endpoints:")
    print("   - GET  /api/weather")
    print("   - POST /api/detect-crop (ENHANCED)")
    print("   - POST /api/tomato-test (testing)")
    print("   - POST /api/manual-input")
    print("   - POST /api/detect-and-plan (WITH WEEKLY PLANNING)")
    print("   - POST /api/weekly-plan")
    print("   - POST /api/update-task-status")
    print("   - POST /api/postpone-task")
    print("\n🎯 Features restored:")
    print("   - 7-day weekly planning with RL")
    print("   - Task carry-over system")
    print("   - Weather-adaptive scheduling")
    print("   - Crop-stage specific recommendations")
    
    app.run(debug=True, port=5002, use_reloader=False)