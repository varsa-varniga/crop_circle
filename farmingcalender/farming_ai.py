class FarmingAI:
    def __init__(self):
        self.supported_crops = {
            'tomato': {'name': 'Tomato'},
            'rice': {'name': 'Rice'},
            'chili': {'name': 'Chili'},
        }
    
    def detect_crop_from_image(self, image_data):
        """Mock crop detection"""
        import random
        crops = ['tomato', 'rice', 'chili']
        stages = ['germination', 'seedling', 'vegetative', 'flowering', 'fruiting', 'harvest']
        
        return {
            'success': True,
            'detected_crop': random.choice(crops),
            'crop_name': self.supported_crops[random.choice(crops)]['name'],
            'growth_stage': random.choice(stages),
            'days_estimate': random.randint(1, 120),
            'confidence': round(random.uniform(75, 95), 1)
        }
    
    def estimate_growth_stage(self, crop):
        """Mock growth stage estimation"""
        import random
        stages = ['germination', 'seedling', 'vegetative', 'flowering', 'fruiting', 'harvest']
        return random.choice(stages)

# Global instance
farming_ai = FarmingAI()