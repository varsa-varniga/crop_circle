# task_monitor.py
import schedule
import time
from datetime import datetime
import json

class RealTimeTaskMonitor:
    def __init__(self, predictor, task_manager):
        self.predictor = predictor
        self.task_manager = task_manager
        self.alert_system = AlertSystem()
        self.running = False
        
    def start_monitoring(self):
        """Start real-time monitoring"""
        self.running = True
        
        # Schedule daily checks
        schedule.every().day.at("06:00").do(self.morning_check)
        schedule.every().day.at("18:00").do(self.evening_check)
        schedule.every().hour().do(self.condition_check)
        
        print("🔄 Starting real-time farm monitoring...")
        
        while self.running:
            schedule.run_pending()
            time.sleep(60)  # Check every minute
    
    def morning_check(self):
        """Perform morning farm assessment"""
        print(f"\n🌅 MORNING CHECK - {datetime.now()}")
        
        # Get current conditions (in real app, from sensors/APIs)
        current_conditions = self.get_current_conditions()
        
        # Generate today's plan
        checklist = self.task_manager.run_daily_check(current_conditions)
        
        # Send morning report
        self.alert_system.send_daily_plan(checklist, current_conditions)
    
    def evening_check(self):
        """Perform evening review"""
        print(f"\n🌇 EVENING REVIEW - {datetime.now()}")
        
        # Review completed tasks
        completed = len(self.task_manager.completed_tasks)
        pending = len(self.task_manager.pending_tasks)
        
        print(f"📊 Daily Summary: {completed} completed, {pending} pending")
        
        # Update ML models with today's learnings
        self.update_models_with_daily_data()
    
    def condition_check(self):
        """Check current conditions for alerts"""
        current_conditions = self.get_current_conditions()
        
        # Check for critical conditions
        self.check_critical_alerts(current_conditions)
    
    def get_current_conditions(self):
        """Get current farming conditions"""
        # In real implementation, this would fetch from:
        # - Weather API
        # - IoT sensors
        # - User input
        
        # Mock data for demonstration
        return [
            30,  # crop_age
            28,  # temperature
            65,  # humidity
            0,   # rainfall
            42,  # soil_moisture
            2    # season
        ]
    
    def check_critical_alerts(self, conditions):
        """Check for conditions requiring immediate attention"""
        _, temp, humidity, rain, soil_moisture, _ = conditions
        
        alerts = []
        
        if soil_moisture < 20:
            alerts.append("🚨 CRITICAL: Very low soil moisture!")
        
        if temp > 38:
            alerts.append("🌡️ ALERT: Extreme temperature!")
        
        if rain > 15:
            alerts.append("🌧️ ALERT: Heavy rainfall!")
        
        for alert in alerts:
            self.alert_system.send_immediate_alert(alert, conditions)
    
    def update_models_with_daily_data(self):
        """Update ML models with today's experiences"""
        # This would collect today's data and retrain models periodically
        print("🤖 Updating AI models with today's learnings...")

class AlertSystem:
    def __init__(self):
        self.alert_history = []
    
    def send_daily_plan(self, checklist, conditions):
        """Send daily farming plan"""
        message = "🌱 TODAY'S FARMING PLAN\n\n"
        
        for task in checklist:
            message += f"• {task['task']} ({task['priority']})\n"
            message += f"  Reason: {task['reason']}\n\n"
        
        print("📨 Daily Plan Sent:")
        print(message)
        self.alert_history.append({
            'timestamp': datetime.now(),
            'type': 'daily_plan',
            'message': message
        })
    
    def send_immediate_alert(self, alert, conditions):
        """Send immediate alert"""
        message = f"⚠️ IMMEDIATE ALERT\n{alert}"
        
        print("🚨 Alert Sent:", message)
        self.alert_history.append({
            'timestamp': datetime.now(),
            'type': 'immediate_alert',
            'message': message,
            'conditions': conditions
        })

# Integration with your existing React app
def create_advanced_ml_api():
    """Create API endpoints for the advanced ML system"""
    predictor = AdvancedFarmingTaskPredictor()
    task_manager = DailyTaskManager(predictor)
    
    # Train on startup
    predictor.train_model()
    
    def predict_tasks_api(json_data):
        """Enhanced prediction API"""
        conditions = [
            json_data.get('crop_age', 30),
            json_data.get('temperature', 25),
            json_data.get('humidity', 60),
            json_data.get('rainfall', 0),
            json_data.get('soil_moisture', 40),
            json_data.get('season', 2)
        ]
        
        # Get AI recommendation
        recommendation = task_manager.run_daily_check(conditions)
        
        return {
            'success': True,
            'daily_checklist': recommendation,
            'pending_tasks': task_manager.pending_tasks,
            'model_type': 'advanced_ml_with_rl'
        }
    
    return predict_tasks_api

# Usage in your React component
"""
// In your AITaskGenerator component, replace the API call with:

const generateAITasks = async () => {
  const response = await axios.post("http://localhost:5000/api/advanced-ai-tasks", {
    crop,
    daysSincePlanting,
    weather,
    soilData
  });

  // The response now includes daily checklist with carried-over tasks
  setAiResult(response.data);
};
"""