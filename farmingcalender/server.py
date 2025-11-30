from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import pandas as pd
import joblib
from datetime import datetime
import os
import random

app = Flask(__name__)
CORS(app)

# Simple ML predictor for demo
class SimpleFarmingPredictor:
    def __init__(self):
        self.task_config = {
            'irrigation': {'priority': 1, 'duration': 2},
            'fertilizer': {'priority': 2, 'duration': 1},
            'pest_control': {'priority': 1, 'duration': 1},
            'harvest': {'priority': 1, 'duration': 3},
            'pruning': {'priority': 3, 'duration': 2},
            'weeding': {'priority': 2, 'duration': 2},
        }
    
    def predict_daily_tasks(self, conditions):
        crop_age, temp, humidity, rain, soil_moisture, season = conditions
        
        tasks = []
        
        # Rule-based task generation
        if soil_moisture < 30:
            tasks.append({
                'id': 1,
                'task': 'irrigation',
                'priority': 'urgent',
                'reason': f'Low soil moisture: {soil_moisture}%',
                'type': 'ai_recommendation',
                'estimated_duration': 2
            })
        
        if 20 <= crop_age <= 40:
            tasks.append({
                'id': 2,
                'task': 'fertilizer',
                'priority': 'high',
                'reason': f'Vegetative stage (day {crop_age}) - needs nutrients',
                'type': 'ai_recommendation', 
                'estimated_duration': 1
            })
        
        if rain > 10:
            tasks.append({
                'id': 3,
                'task': 'drainage_check',
                'priority': 'high',
                'reason': f'Heavy rain expected: {rain}mm',
                'type': 'weather_alert',
                'estimated_duration': 1
            })
        
        # Always have at least one general task
        if not tasks:
            tasks.append({
                'id': 4,
                'task': 'general_care',
                'priority': 'medium',
                'reason': 'Routine maintenance and observation',
                'type': 'ai_recommendation',
                'estimated_duration': 1
            })
        
        return tasks

# Initialize predictor
predictor = SimpleFarmingPredictor()
tasks = []  # In-memory storage for demo

print("🤖 Simple Farming AI Initialized!")
print("🚀 Starting Smart Farming Calendar Backend...")

@app.route('/api/weather', methods=['GET'])
def get_weather():
    """Mock weather data"""
    return jsonify({
        'temp': random.randint(25, 35),
        'humidity': random.randint(50, 80),
        'description': 'clear sky',
        'rain': random.randint(0, 5)
    })

@app.route('/api/tasks', methods=['GET'])
def get_tasks():
    return jsonify(tasks)

@app.route('/api/tasks', methods=['POST'])
def create_task():
    task = request.json
    task['_id'] = len(tasks) + 1
    task['date'] = datetime.now().isoformat()
    tasks.append(task)
    return jsonify(task)

@app.route('/api/tasks/<int:task_id>', methods=['PATCH'])
def update_task(task_id):
    task = next((t for t in tasks if t['_id'] == task_id), None)
    if task:
        task.update(request.json)
        return jsonify(task)
    return jsonify({'error': 'Task not found'}), 404

@app.route('/api/tasks/<int:task_id>', methods=['DELETE'])
def delete_task(task_id):
    global tasks
    tasks = [t for t in tasks if t['_id'] != task_id]
    return jsonify({'message': 'Task deleted'})

@app.route('/api/advanced-ai-tasks', methods=['POST'])
def advanced_ai_tasks():
    try:
        data = request.json
        crop = data.get('crop', 'tomato')
        days_since_planting = data.get('daysSincePlanting', 30)
        weather = data.get('weather', {})
        soil_data = data.get('soilData', {})
        
        # Prepare conditions
        conditions = [
            days_since_planting,
            weather.get('temp', 28),
            weather.get('humidity', 65),
            weather.get('rain', 0),
            soil_data.get('moisture', 40),
            get_current_season()
        ]
        
        # Get tasks from predictor
        daily_checklist = predictor.predict_daily_tasks(conditions)
        
        return jsonify({
            'success': True,
            'daily_checklist': daily_checklist,
            'pending_tasks': [],
            'model_type': 'simple_ai_demo',
            'message': 'AI generated daily farming plan'
        })
        
    except Exception as e:
        print(f"AI error: {e}")
        return jsonify({
            'success': False,
            'error': str(e),
            'daily_checklist': [],
            'pending_tasks': []
        })

@app.route('/api/ai-tasks', methods=['POST'])
def ai_tasks():
    """Basic AI tasks fallback"""
    return jsonify({
        'success': True,
        'tasks': [
            {
                'title': 'Water plants',
                'type': 'irrigation',
                'reason': 'Basic irrigation task',
                'priority': 'medium',
                'confidence': 75
            }
        ],
        'model': 'basic_ai'
    })

@app.route('/api/complete-task', methods=['POST'])
def complete_task():
    return jsonify({'success': True, 'message': 'Task completion recorded'})

def get_current_season():
    month = datetime.now().month
    if 3 <= month <= 5:
        return 1  # spring
    elif 6 <= month <= 8:
        return 2  # summer
    elif 9 <= month <= 11:
        return 3  # autumn
    else:
        return 4  # winter

if __name__ == '__main__':
    print("📡 Server running on http://localhost:5000")
    app.run(debug=True, port=5000)