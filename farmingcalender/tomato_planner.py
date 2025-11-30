# tomato_planner.py
from datetime import datetime, timedelta
import json

class TomatoCropPlanner:
    def __init__(self):
        self.stage_tasks = {
            'germination': {
                'daily': [
                    {'task': 'moisture_check', 'priority': 'high', 'duration': 1, 'reason': 'Seeds need consistent moisture'},
                    {'task': 'temperature_monitor', 'priority': 'medium', 'duration': 1, 'reason': 'Optimal germination temperature 20-25°C'}
                ],
                'weekly': [
                    {'task': 'light_adjustment', 'priority': 'medium', 'reason': 'Ensure 12-16 hours light'},
                    {'task': 'ventilation_check', 'priority': 'low', 'reason': 'Prevent fungal growth'}
                ]
            },
            'seedling': {
                'daily': [
                    {'task': 'watering', 'priority': 'high', 'duration': 1, 'reason': 'Keep soil moist but not waterlogged'},
                    {'task': 'light_monitor', 'priority': 'high', 'duration': 1, 'reason': 'Seedlings need strong light'}
                ],
                'weekly': [
                    {'task': 'thin_seedlings', 'priority': 'medium', 'reason': 'Remove weak seedlings for better growth'},
                    {'task': 'fertilize_lightly', 'priority': 'low', 'reason': 'First nutrient application'}
                ]
            },
            'vegetative': {
                'daily': [
                    {'task': 'deep_watering', 'priority': 'high', 'duration': 2, 'reason': 'Promote deep root growth'},
                    {'task': 'pest_check', 'priority': 'medium', 'duration': 1, 'reason': 'Monitor for aphids and mites'}
                ],
                'weekly': [
                    {'task': 'apply_nitrogen_fertilizer', 'priority': 'high', 'reason': 'Support leaf and stem growth'},
                    {'task': 'prune_suckers', 'priority': 'medium', 'reason': 'Remove side shoots for better growth'},
                    {'task': 'stake_plants', 'priority': 'medium', 'reason': 'Support growing plants'}
                ]
            },
            'flowering': {
                'daily': [
                    {'task': 'pollination_check', 'priority': 'medium', 'duration': 1, 'reason': 'Ensure proper flower pollination'},
                    {'task': 'water_consistently', 'priority': 'high', 'duration': 2, 'reason': 'Critical for fruit set'}
                ],
                'weekly': [
                    {'task': 'apply_phosphorus_rich_fertilizer', 'priority': 'high', 'reason': 'Support flower and fruit development'},
                    {'task': 'monitor_blossom_drop', 'priority': 'medium', 'reason': 'Check for temperature stress'},
                    {'task': 'pest_control', 'priority': 'high', 'reason': 'Protect flowers from pests'}
                ]
            },
            'fruiting': {
                'daily': [
                    {'task': 'fruit_inspection', 'priority': 'medium', 'duration': 1, 'reason': 'Monitor fruit development'},
                    {'task': 'consistent_watering', 'priority': 'high', 'duration': 2, 'reason': 'Prevent blossom end rot'}
                ],
                'weekly': [
                    {'task': 'apply_calcium_supplement', 'priority': 'medium', 'reason': 'Prevent calcium deficiency'},
                    {'task': 'support_heavy_branches', 'priority': 'high', 'reason': 'Prevent branch breakage'},
                    {'task': 'disease_prevention', 'priority': 'medium', 'reason': 'Spray for fungal diseases'}
                ]
            },
            'harvest': {
                'daily': [
                    {'task': 'harvest_ripe_fruits', 'priority': 'high', 'duration': 3, 'reason': 'Pick tomatoes at peak ripeness'},
                    {'task': 'quality_check', 'priority': 'medium', 'duration': 1, 'reason': 'Sort and grade harvested fruits'}
                ],
                'weekly': [
                    {'task': 'post_harvest_care', 'priority': 'medium', 'reason': 'Clean and store properly'},
                    {'task': 'plant_health_assessment', 'priority': 'low', 'reason': 'Plan for next cycle'}
                ]
            }
        }
        
        self.weather_adaptations = {
            'hot': ['increase_watering', 'provide_shade', 'mulch_soil'],
            'rainy': ['reduce_watering', 'improve_drainage', 'fungicide_application'],
            'cold': ['reduce_watering', 'add_protection', 'delay_fertilizing']
        }
    
    def generate_daily_plan(self, stage, weather_condition=None, health_score=80):
        """Generate daily tasks based on growth stage"""
        base_tasks = self.stage_tasks[stage]['daily'].copy()
        
        # Adjust based on plant health
        if health_score < 60:
            base_tasks.append({
                'task': 'extra_care_monitoring',
                'priority': 'high',
                'duration': 1,
                'reason': f'Plant health low ({health_score}%) - needs attention'
            })
        
        # Adapt for weather conditions
        if weather_condition in self.weather_adaptations:
            for adaptation in self.weather_adaptations[weather_condition]:
                base_tasks.append({
                    'task': adaptation,
                    'priority': 'medium',
                    'duration': 1,
                    'reason': f'Weather adaptation for {weather_condition} conditions'
                })
        
        return base_tasks
    
    def generate_weekly_plan(self, stage, start_date=None):
        """Generate weekly plan with date scheduling"""
        if start_date is None:
            start_date = datetime.now()
        
        weekly_tasks = self.stage_tasks[stage]['weekly']
        scheduled_plan = []
        
        for i, task in enumerate(weekly_tasks):
            task_date = start_date + timedelta(days=i * 2)  # Spread tasks through week
            scheduled_plan.append({
                **task,
                'scheduled_date': task_date.strftime('%Y-%m-%d'),
                'day': task_date.strftime('%A')
            })
        
        return scheduled_plan
    
    def get_stage_timeline(self, current_stage):
        """Get timeline for tomato growth stages"""
        timeline = []
        current_date = datetime.now()
        
        for stage, info in self.stages.items():
            if stage == current_stage:
                timeline.append({
                    'stage': stage,
                    'status': 'current',
                    'start_date': current_date.strftime('%Y-%m-%d'),
                    'duration': f"{info['days'][1] - info['days'][0]} days",
                    'description': info['description']
                })
            else:
                timeline.append({
                    'stage': stage,
                    'status': 'upcoming' if list(self.stages.keys()).index(stage) > list(self.stages.keys()).index(current_stage) else 'completed',
                    'description': info['description']
                })
        
        return timeline