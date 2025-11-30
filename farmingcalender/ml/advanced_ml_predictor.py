import numpy as np
import pandas as pd
import joblib
import os
from datetime import datetime, timedelta
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
import warnings
warnings.filterwarnings('ignore')

class ReinforcementLearningTaskOptimizer:
    def __init__(self):
        self.q_table = {}  # State-action values
        self.learning_rate = 0.1
        self.discount_factor = 0.9
        self.exploration_rate = 0.3
        self.state_history = []
        
    def get_state_key(self, state):
        """Convert state to hashable key"""
        return tuple(state)
    
    def choose_action(self, state, possible_actions):
        """Choose action using epsilon-greedy policy"""
        state_key = self.get_state_key(state)
        
        if state_key not in self.q_table:
            self.q_table[state_key] = {action: 0 for action in possible_actions}
        
        # Exploration vs Exploitation
        if np.random.random() < self.exploration_rate:
            return np.random.choice(possible_actions)
        else:
            return max(self.q_table[state_key], key=self.q_table[state_key].get)
    
    def update_q_value(self, state, action, reward, next_state, next_possible_actions):
        """Update Q-value using Q-learning"""
        state_key = self.get_state_key(state)
        next_state_key = self.get_state_key(next_state)
        
        # Initialize if state doesn't exist
        if state_key not in self.q_table:
            self.q_table[state_key] = {action: 0 for action in next_possible_actions}
        if next_state_key not in self.q_table:
            self.q_table[next_state_key] = {action: 0 for action in next_possible_actions}
        
        # Q-learning update
        current_q = self.q_table[state_key][action]
        max_next_q = max(self.q_table[next_state_key].values()) if self.q_table[next_state_key] else 0
        
        new_q = current_q + self.learning_rate * (reward + self.discount_factor * max_next_q - current_q)
        self.q_table[state_key][action] = new_q

class AdvancedFarmingTaskPredictor:
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.is_trained = False
        self.rl_optimizer = ReinforcementLearningTaskOptimizer()
        self.task_history = []
        self.weather_history = []
        
        # Enhanced feature set
        self.features = [
            'crop_age', 'temperature', 'humidity', 'rainfall', 
            'soil_moisture', 'season', 'prev_day_rainfall', 
            'prev_day_temp', 'pending_tasks_count', 'days_since_last_irrigation'
        ]
        
        # Task configurations with priorities and dependencies
        self.task_config = {
            'irrigation': {
                'priority': 1,
                'max_delay': 2,
                'depends_on': [],
                'duration': 2
            },
            'fertilizer': {
                'priority': 2,
                'max_delay': 3,
                'depends_on': ['irrigation'],
                'duration': 1
            },
            'pest_control': {
                'priority': 1,
                'max_delay': 1,
                'depends_on': [],
                'duration': 1
            },
            'harvest': {
                'priority': 1,
                'max_delay': 0,
                'depends_on': [],
                'duration': 3
            },
            'pruning': {
                'priority': 3,
                'max_delay': 5,
                'depends_on': [],
                'duration': 2
            },
            'weeding': {
                'priority': 2,
                'max_delay': 4,
                'depends_on': [],
                'duration': 2
            },
            'soil_testing': {
                'priority': 4,
                'max_delay': 10,
                'depends_on': [],
                'duration': 1
            },
            'general_care': {
                'priority': 5,
                'max_delay': 7,
                'depends_on': [],
                'duration': 1
            },
            'drainage_check': {
                'priority': 1,
                'max_delay': 1,
                'depends_on': [],
                'duration': 1
            },
            'shade_management': {
                'priority': 2,
                'max_delay': 2,
                'depends_on': [],
                'duration': 1
            },
            'frost_protection': {
                'priority': 1,
                'max_delay': 1,
                'depends_on': [],
                'duration': 1
            }
        }
        
        # Initialize with enhanced training data
        self.initialize_training_data()
        self.load_historical_data()
    
    def initialize_training_data(self):
        """Create comprehensive training dataset"""
        np.random.seed(42)
        
        # Generate synthetic farming data
        n_samples = 1000
        self.X_train = np.zeros((n_samples, len(self.features)))
        
        for i in range(n_samples):
            self.X_train[i] = [
                np.random.randint(1, 120),  # crop_age
                np.random.uniform(15, 40),  # temperature
                np.random.uniform(30, 90),  # humidity
                np.random.uniform(0, 20),   # rainfall
                np.random.uniform(20, 80),  # soil_moisture
                np.random.randint(1, 5),    # season
                np.random.uniform(0, 15),   # prev_day_rainfall
                np.random.uniform(15, 40),  # prev_day_temp
                np.random.randint(0, 5),    # pending_tasks_count
                np.random.randint(0, 7)     # days_since_last_irrigation
            ]
        
        # Generate labels based on rules + noise
        self.y_train = []
        for features in self.X_train:
            task = self.rule_based_predictor(features)
            # Add some randomness
            if np.random.random() < 0.1:
                task = np.random.choice(list(self.task_config.keys()))
            self.y_train.append(task)
        
        self.y_train = np.array(self.y_train)
    
    def rule_based_predictor(self, features):
        """Rule-based fallback predictor"""
        crop_age, temp, humidity, rain, soil_moisture, season, _, _, pending_tasks, days_since_irrigation = features
        
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
        elif days_since_irrigation > 5:
            return 'irrigation'
        else:
            return 'general_care'
    
    def load_historical_data(self):
        """Load or create historical data for RL training"""
        try:
            if os.path.exists('farming_history.csv'):
                self.historical_data = pd.read_csv('farming_history.csv')
            else:
                # Create sample historical data
                self.historical_data = pd.DataFrame(columns=[
                    'date', 'crop_age', 'temperature', 'humidity', 'rainfall',
                    'soil_moisture', 'recommended_task', 'actual_task',
                    'completed', 'yield_impact', 'weather_impact'
                ])
        except:
            self.historical_data = pd.DataFrame()
    
    def train_model(self):
        """Train the ML model with enhanced features"""
        try:
            # Scale features
            X_scaled = self.scaler.fit_transform(self.X_train)
            
            # Train Random Forest with optimized parameters
            self.model = RandomForestClassifier(
                n_estimators=200,
                max_depth=15,
                min_samples_split=5,
                min_samples_leaf=2,
                random_state=42
            )
            
            self.model.fit(X_scaled, self.y_train)
            self.is_trained = True
            
            # Calculate feature importance
            feature_importance = dict(zip(self.features, self.model.feature_importances_))
            print("✅ Model trained successfully!")
            print("📊 Feature Importance:", feature_importance)
            
            return True
            
        except Exception as e:
            print(f"❌ Error training model: {e}")
            return False
    
    def predict_with_reinforcement(self, current_state, pending_tasks=None):
        """Enhanced prediction with RL optimization"""
        if pending_tasks is None:
            pending_tasks = []
        
        # Get ML prediction
        ml_prediction = self.ml_predict(current_state)
        
        # Prepare state for RL
        rl_state = self.prepare_rl_state(current_state, pending_tasks)
        
        # Get possible actions (tasks)
        possible_actions = self.get_possible_actions(rl_state, pending_tasks)
        
        if not possible_actions:
            return ml_prediction
        
        # Use RL to choose optimal action
        optimal_task = self.rl_optimizer.choose_action(rl_state, possible_actions)
        
        return optimal_task
    
    def prepare_rl_state(self, current_state, pending_tasks):
        """Prepare state representation for RL"""
        state = list(current_state)
        
        # Add pending tasks information
        task_urgency = sum([self.calculate_task_urgency(task) for task in pending_tasks])
        state.append(task_urgency)
        state.append(len(pending_tasks))
        
        return state
    
    def calculate_task_urgency(self, task):
        """Calculate urgency score for a task"""
        if isinstance(task, dict) and 'task' in task:
            task_name = task['task']
        else:
            task_name = task
            
        if task_name not in self.task_config:
            return 0
        
        config = self.task_config[task_name]
        return (1 / config['max_delay']) * config['priority']
    
    def get_possible_actions(self, state, pending_tasks):
        """Get possible actions considering dependencies and constraints"""
        possible_actions = []
        
        # Always consider new ML prediction
        ml_prediction = self.ml_predict(state[:len(self.features)])
        possible_actions.append(ml_prediction)
        
        # Add pending tasks that are still relevant
        for task in pending_tasks:
            if self.is_task_still_relevant(task, state):
                if isinstance(task, dict) and 'task' in task:
                    possible_actions.append(task['task'])
                else:
                    possible_actions.append(task)
        
        # Remove duplicates and return
        return list(set(possible_actions))
    
    def is_task_still_relevant(self, task, current_state):
        """Check if a pending task is still relevant given current conditions"""
        if isinstance(task, dict) and 'task' in task:
            task_name = task['task']
        else:
            task_name = task
            
        crop_age, temp, humidity, rain, soil_moisture, season = current_state[:6]
        
        task_rules = {
            'irrigation': soil_moisture < 60,
            'fertilizer': 15 <= crop_age <= 50 and rain < 5,
            'pest_control': humidity > 70 or temp > 30,
            'harvest': crop_age >= 70,
            'weeding': True,  # Always relevant if not done
            'pruning': 30 <= crop_age <= 80,
            'soil_testing': crop_age % 30 == 0,  # Every 30 days
            'general_care': True,
            'drainage_check': rain > 5,
            'shade_management': temp > 35,
            'frost_protection': temp < 10
        }
        
        return task_rules.get(task_name, False)
    
    def ml_predict(self, features):
        """Core ML prediction"""
        if not self.is_trained:
            return self.rule_based_predictor(features)
        
        try:
            input_features = np.array([features])
            input_scaled = self.scaler.transform(input_features)
            prediction = self.model.predict(input_scaled)[0]
            return prediction
        except:
            return self.rule_based_predictor(features)
    
    def update_reinforcement_model(self, state, action, reward, next_state):
        """Update RL model based on outcomes"""
        next_possible_actions = self.get_possible_actions(next_state, [])
        self.rl_optimizer.update_q_value(state, action, reward, next_state, next_possible_actions)
    
    def calculate_reward(self, task, conditions, outcome):
        """Calculate reward for RL based on task performance"""
        base_reward = 0
        
        # Task completion reward
        if outcome == 'completed':
            base_reward += 10
        
        # Weather adaptation reward
        if self.is_weather_appropriate(task, conditions):
            base_reward += 5
        
        # Crop stage appropriateness reward
        if self.is_stage_appropriate(task, conditions[0]):  # crop_age
            base_reward += 5
        
        # Penalty for delayed high-priority tasks
        if outcome == 'delayed' and self.task_config.get(task, {}).get('priority', 3) <= 2:
            base_reward -= 8
        
        return base_reward
    
    def is_weather_appropriate(self, task, conditions):
        """Check if task is appropriate for current weather"""
        _, temp, humidity, rain, _, _ = conditions
        
        weather_rules = {
            'irrigation': rain < 5,
            'fertilizer': rain < 3 and temp < 35,
            'pest_control': not (rain > 10),
            'harvest': rain < 2,
            'pruning': not (rain > 5 or temp > 35),
            'drainage_check': rain > 5,  # Actually appropriate for drainage check
            'shade_management': temp > 30,
            'frost_protection': temp < 15
        }
        
        return weather_rules.get(task, True)
    
    def is_stage_appropriate(self, task, crop_age):
        """Check if task is appropriate for crop stage"""
        stage_rules = {
            'irrigation': True,  # Always needed
            'fertilizer': 15 <= crop_age <= 60,
            'pest_control': crop_age >= 20,
            'harvest': crop_age >= 70,
            'pruning': 25 <= crop_age <= 75,
            'weeding': crop_age >= 10,
            'soil_testing': crop_age % 30 == 0,
            'general_care': True
        }
        
        return stage_rules.get(task, True)
    
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
    
    def get_task_reason(self, task, conditions):
        """Generate human-readable reason for task"""
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
        
        return reason_map.get(task, "AI-optimized farming task")

class DailyTaskManager:
    def __init__(self, predictor):
        self.predictor = predictor
        self.pending_tasks = []
        self.completed_tasks = []
        self.daily_checklist = []
    
    def run_daily_check(self, current_conditions):
        """Perform comprehensive daily check and task planning"""
        print(f"\n{'='*50}")
        print(f"📅 DAILY FARMING CHECK - {datetime.now().strftime('%Y-%m-%d')}")
        print(f"{'='*50}")
        
        # Get AI recommendations
        recommendations = self.get_daily_recommendations(current_conditions)
        
        # Carry over pending tasks
        carried_tasks = self.carry_over_pending_tasks(current_conditions)
        
        # Combine and prioritize
        all_tasks = self.prioritize_tasks(recommendations + carried_tasks, current_conditions)
        
        # Create daily checklist
        self.daily_checklist = self.create_daily_checklist(all_tasks, current_conditions)
        
        return self.daily_checklist
    
    def get_daily_recommendations(self, conditions):
        """Get AI-powered daily recommendations"""
        recommendations = []
        
        # Main AI prediction
        main_task = self.predictor.predict_with_reinforcement(conditions, self.pending_tasks)
        recommendations.append({
            'task': main_task,
            'type': 'ai_recommendation',
            'priority': 'high',
            'reason': self.predictor.get_task_reason(main_task, conditions)
        })
        
        # Additional checks
        additional_tasks = self.perform_additional_checks(conditions)
        recommendations.extend(additional_tasks)
        
        return recommendations
    
    def perform_additional_checks(self, conditions):
        """Perform various automated checks"""
        checks = []
        crop_age, temp, humidity, rain, soil_moisture, season = conditions[:6]
        
        # Soil moisture check
        if soil_moisture < 25:
            checks.append({
                'task': 'irrigation',
                'type': 'critical_alert',
                'priority': 'urgent',
                'reason': f'Low soil moisture: {soil_moisture}%'
            })
        
        # Weather impact check
        if rain > 10:
            checks.append({
                'task': 'drainage_check',
                'type': 'weather_alert',
                'priority': 'high',
                'reason': f'Heavy rain expected: {rain}mm'
            })
        
        if temp > 35:
            checks.append({
                'task': 'shade_management',
                'type': 'weather_alert',
                'priority': 'medium',
                'reason': f'High temperature: {temp}°C'
            })
        
        # Growth stage checks
        if crop_age in [30, 60, 90]:
            checks.append({
                'task': 'growth_assessment',
                'type': 'scheduled_check',
                'priority': 'medium',
                'reason': f'Milestone: {crop_age} days growth'
            })
        
        return checks
    
    def carry_over_pending_tasks(self, current_conditions):
        """Intelligently carry over pending tasks"""
        carried_tasks = []
        
        for task in self.pending_tasks[:]:  # Iterate over copy
            if self.should_carry_over(task, current_conditions):
                carried_tasks.append({
                    'task': task['task'],
                    'type': 'carried_over',
                    'priority': self.increase_priority(task['priority']),
                    'reason': f"Pending from previous day - {task.get('reason', '')}",
                    'days_pending': task.get('days_pending', 0) + 1
                })
            else:
                print(f"❌ Dropping task: {task['task']} - No longer relevant")
        
        # Update pending tasks
        self.pending_tasks = carried_tasks.copy()
        
        return carried_tasks
    
    def should_carry_over(self, task, conditions):
        """Determine if task should be carried over"""
        task_name = task['task']
        
        # Check if task is still relevant
        if not self.predictor.is_task_still_relevant(task_name, conditions):
            return False
        
        # Check maximum delay
        max_delay = self.predictor.task_config.get(task_name, {}).get('max_delay', 7)
        days_pending = task.get('days_pending', 0)
        
        if days_pending >= max_delay:
            print(f"⚠️ Task {task_name} exceeded maximum delay of {max_delay} days")
            return False
        
        return True
    
    def increase_priority(self, current_priority):
        """Increase priority for carried-over tasks"""
        priority_map = {
            'low': 'medium',
            'medium': 'high',
            'high': 'urgent',
            'urgent': 'urgent'
        }
        return priority_map.get(current_priority, 'medium')
    
    def prioritize_tasks(self, tasks, conditions):
        """Prioritize tasks using sophisticated algorithm"""
        scored_tasks = []
        
        for task in tasks:
            score = self.calculate_task_score(task, conditions)
            scored_tasks.append((score, task))
        
        # Sort by score (descending)
        scored_tasks.sort(key=lambda x: x[0], reverse=True)
        
        return [task for score, task in scored_tasks]
    
    def calculate_task_score(self, task, conditions):
        """Calculate priority score for task"""
        score = 0
        
        # Base priority scores
        priority_scores = {
            'urgent': 100,
            'high': 75,
            'medium': 50,
            'low': 25
        }
        
        score += priority_scores.get(task['priority'], 50)
        
        # Type modifiers
        type_modifiers = {
            'critical_alert': 30,
            'weather_alert': 25,
            'ai_recommendation': 20,
            'carried_over': 15,
            'scheduled_check': 10
        }
        
        score += type_modifiers.get(task['type'], 0)
        
        # Days pending bonus (urgency)
        days_pending = task.get('days_pending', 0)
        score += days_pending * 5
        
        return score
    
    def create_daily_checklist(self, tasks, conditions):
        """Create formatted daily checklist"""
        checklist = []
        
        print("\n📋 TODAY'S FARMING CHECKLIST:")
        print("-" * 40)
        
        for i, task in enumerate(tasks, 1):
            checklist_item = {
                'id': i,
                'task': task['task'],
                'priority': task['priority'],
                'reason': task['reason'],
                'type': task['type'],
                'estimated_duration': self.predictor.task_config.get(task['task'], {}).get('duration', 1)
            }
            
            checklist.append(checklist_item)
            
            # Print formatted output
            priority_emoji = {'urgent': '🚨', 'high': '🔴', 'medium': '🟡', 'low': '🟢'}
            print(f"{priority_emoji.get(task['priority'], '⚪')} {i}. {task['task']}")
            print(f"   📝 Reason: {task['reason']}")
            print(f"   🏷️ Type: {task['type'].replace('_', ' ').title()}")
            print()
        
        return checklist
    
    def mark_task_completed(self, task_id, conditions, outcome='completed'):
        """Mark task as completed and update models"""
        if 1 <= task_id <= len(self.daily_checklist):
            task = self.daily_checklist[task_id - 1]
            
            # Move to completed
            self.completed_tasks.append(task)
            
            # Remove from pending if it was there
            self.pending_tasks = [t for t in self.pending_tasks if t['task'] != task['task']]
            
            # Update RL model
            reward = self.predictor.calculate_reward(task['task'], conditions, outcome)
            next_state = conditions  # Simplified next state
            
            # For RL update, we'd need the previous state - in practice, store state history
            print(f"✅ Task '{task['task']}' completed! Reward: {reward}")
            
            return True
        return False
    
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
        self.update_reinforcement_model(
            current_conditions,
            task_to_postpone['task'],
            reward,
            current_conditions  # Same state for simplicity
        )
    
    # Add to next day's pending tasks
        next_day = datetime.now() + timedelta(days=1)
        next_day_str = next_day.strftime('%Y-%m-%d')
    
        if next_day_str in self.weekly_plan['daily_plans']:
            postponed_tasks = self.weekly_plan['daily_plans'][next_day_str].get('postponed_tasks', [])
            postponed_tasks.append(task_to_postpone)
            self.weekly_plan['daily_plans'][next_day_str]['postponed_tasks'] = postponed_tasks
    
        print(f"🔄 Task '{task_to_postpone['task']}' postponed to tomorrow. Reason: {reason}")
        return True

# Enhanced main function with daily automation
def main():
    # Initialize the advanced predictor
    predictor = AdvancedFarmingTaskPredictor()
    task_manager = DailyTaskManager(predictor)
    
    # Train the model
    print("🤖 Training Advanced Farming AI...")
    predictor.train_model()
    
    # Simulate multiple days of farming
    print("\n🌱 SIMULATING 7-DAY FARMING CYCLE")
    print("=" * 50)
    
    # Sample conditions for a week [crop_age, temp, humidity, rain, soil_moisture, season]
    weekly_conditions = [
        [25, 28, 65, 2, 45, 2],   # Day 1 - Normal
        [26, 30, 60, 0, 35, 2],   # Day 2 - Getting dry
        [27, 32, 55, 0, 28, 2],   # Day 3 - Very dry
        [28, 28, 70, 12, 65, 2],  # Day 4 - Rainy
        [29, 26, 75, 5, 60, 2],   # Day 5 - Post-rain
        [30, 28, 68, 0, 50, 2],   # Day 6 - Normal
        [31, 29, 65, 0, 45, 2]    # Day 7 - Normal
    ]
    
    for day, conditions in enumerate(weekly_conditions, 1):
        print(f"\n📅 DAY {day} SIMULATION")
        print(f"🌡️ Conditions: {conditions[1]}°C, 💧 {conditions[3]}mm rain, 🌱 {conditions[4]}% soil")
        
        # Run daily check
        checklist = task_manager.run_daily_check(conditions)
        
        # Simulate completing some tasks
        if checklist:
            # Complete first task
            task_manager.mark_task_completed(1, conditions)
            
            # Sometimes postpone a task
            if day == 2 and len(checklist) > 1:
                task_manager.postpone_task(2, "Waiting for better weather")
        
        print(f"📊 Day {day} Summary:")
        print(f"   ✅ Completed: {len(task_manager.completed_tasks)}")
        print(f"   ⏳ Pending: {len(task_manager.pending_tasks)}")
        print(f"   📋 Today's tasks: {len(checklist)}")

if __name__ == "__main__":
    main()