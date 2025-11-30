import numpy as np
from datetime import datetime, timedelta
import json

class RLWeeklyPlanner:
    def __init__(self, predictor):
        self.predictor = predictor
        self.task_completion_history = {}
        self.weekly_schedule = {}
        
    def generate_weekly_plan(self, crop_info, current_conditions, pending_tasks=None):
        """Generate comprehensive weekly plan with RL optimization"""
        if pending_tasks is None:
            pending_tasks = []
            
        crop_type = crop_info.get('crop', 'tomato')
        current_stage = crop_info.get('growth_stage', 'vegetative')
        days_since_planting = crop_info.get('days_estimate', 30)
        
        weekly_plan = {
            'crop': crop_type,
            'current_stage': current_stage,
            'days_since_planting': days_since_planting,
            'generated_date': datetime.now().isoformat(),
            'week_start': datetime.now().strftime('%Y-%m-%d'),
            'daily_plans': {},
            'carry_over_tasks': [],
            'weekly_goals': self.get_weekly_goals(current_stage, crop_type)
        }
        
        # Generate plan for next 7 days
        for day_offset in range(7):
            day_date = datetime.now() + timedelta(days=day_offset)
            day_plan = self.generate_daily_plan(
                day_date, 
                current_conditions, 
                crop_info,
                pending_tasks,
                day_offset
            )
            weekly_plan['daily_plans'][day_date.strftime('%Y-%m-%d')] = day_plan
            
            # Update pending tasks for next day
            pending_tasks = day_plan.get('postponed_tasks', [])
            
        weekly_plan['carry_over_tasks'] = pending_tasks
        return weekly_plan
    
    def generate_daily_plan(self, date, conditions, crop_info, pending_tasks, day_offset):
        """Generate daily plan with RL optimization"""
        # Adjust conditions for future days
        adjusted_conditions = self.predict_conditions(conditions, day_offset)
        
        # Get AI recommendations for this day
        ai_recommendations = "general_care"  # Default fallback
        
        try:
            ai_recommendations = self.predictor.predict_with_reinforcement(
                adjusted_conditions, 
                pending_tasks
            )
        except:
            # Fallback to rule-based prediction
            ai_recommendations = self.predictor.rule_based_predictor(adjusted_conditions)
        
        # Convert to task format
        main_task = {
            'task': ai_recommendations,
            'type': 'ai_recommendation',
            'priority': 'high',
            'reason': self.get_task_reason(ai_recommendations, adjusted_conditions),
            'estimated_duration': 2,
            'is_carry_over': False
        }
        
        # Process pending tasks with RL prioritization
        processed_pending = self.prioritize_pending_tasks(pending_tasks, adjusted_conditions)
        
        # Combine tasks (main AI task + prioritized pending tasks)
        all_tasks = [main_task] + processed_pending[:2]  # Limit to 3 tasks per day
        
        # Mark postponed tasks for next day
        postponed_tasks = processed_pending[2:] if len(processed_pending) > 2 else []
        
        return {
            'date': date.strftime('%Y-%m-%d'),
            'day_name': date.strftime('%A'),
            'day_offset': day_offset,
            'predicted_conditions': adjusted_conditions,
            'tasks': all_tasks,
            'postponed_tasks': postponed_tasks,
            'total_tasks': len(all_tasks),
            'total_duration': sum(task.get('estimated_duration', 1) for task in all_tasks)
        }
    
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
            
        return min(base_score, 100)  # Cap at 100
    
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
            'soil_testing': crop_age % 30 == 0,
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
    
    def get_task_reason(self, task, conditions):
        """Generate reason for task"""
        if len(conditions) < 6:
            return f"AI recommended {task}"
            
        crop_age, temp, humidity, rain, soil_moisture, season = conditions
        
        reason_map = {
            'irrigation': f"Soil moisture low ({soil_moisture}%) - plants need water",
            'fertilizer': f"Crop at day {crop_age} - vegetative stage needs nutrients", 
            'pest_control': f"High pest risk at day {crop_age} with {humidity}% humidity",
            'harvest': f"Crop mature at day {crop_age} - ready for harvest",
            'drainage_check': f"Heavy rain expected ({rain}mm) - check drainage",
            'shade_management': f"High temperature ({temp}°C) - provide shade",
            'frost_protection': f"Low temperature ({temp}°C) - protect from frost",
            'weeding': f"Weed growth detected - remove competing plants",
            'pruning': f"Crop at optimal pruning stage ({crop_age} days)",
            'soil_testing': f"Regular soil health check due",
            'general_care': f"Routine maintenance and observation"
        }
        
        return reason_map.get(task, f"AI-optimized farming task for day {crop_age}")
    
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