import os
import io
import json
import numpy as np
from PIL import Image
import torch
import torchvision.transforms as transforms
import torchvision.models as models

try:
    from middleware.logging import logger
except ImportError:
    import logging
    logger = logging.getLogger(__name__)

# Global model state
_model = None
_categories = None
_is_local = False

# Global pre-processing (Avoid re-creating on every request)
_preprocess = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])

def get_model():
    global _model, _categories, _is_local
    if _model is None:
        script_dir = os.path.dirname(os.path.abspath(__file__))
        model_path = os.path.join(script_dir, "model.pth")
        class_path = os.path.join(script_dir, "class_indices.json")

        if os.path.exists(model_path) and os.path.exists(class_path):
            logger.info("Loading Local Pilot-Trained Model (Perfectly Match Dataset)...")
            with open(class_path, 'r') as f:
                indices = json.load(f)
                # Ensure keys are integers (json saves them as strings)
                _categories = {int(k): v for k, v in indices.items()}
            
            num_classes = len(_categories)
            from .model import get_model as get_arch
            _model = get_arch(num_classes=num_classes)
            _model.load_state_dict(torch.load(model_path, map_location=torch.device('cpu')))
            _is_local = True
        else:
            logger.info("Initializing Pure-PyTorch Generic Inference (EfficientNet-B0)...")
            _model = models.efficientnet_b0(pretrained=True)
            _is_local = False
            
        _model.eval()
    return _model

def get_shared_model():
    """Explicitly pre-load the model to avoid first-request latency."""
    logger.info("⚡ Pre-loading AI Model and Weights...")
    return get_model()

def get_scene_relevance(img):
    """
    Heuristic to detect if the image is a screenshot, UI, or non-nature.
    Checks for digital syntheticness vs natural variety.
    """
    # 1. Color Variety Check (Nature images are extremely inverse/diverse)
    # Total pixels in 64x64 = 4096
    img_small = img.resize((64, 64))
    pixels = np.array(img_small).reshape(-1, 3).astype(np.int32)
    # Bit-pack RGB into a single int to speed up np.unique
    packed = (pixels[:, 0] << 16) | (pixels[:, 1] << 8) | pixels[:, 2]
    unique_colors = len(np.unique(packed))
    variety_ratio = unique_colors / 4096.0
    
    # 2. Grey Dominance Check (UI/Screenshots are often mostly grey/white/black)
    # Check standard deviation between R, G, B channels
    channel_std = np.mean(np.std(pixels, axis=1))
    # If channel_std is low, the pixel is "grey-ish"
    is_grey_dominant = np.mean(np.std(pixels, axis=1) < 15.0) > 0.6 # >60% of pixels are grey

    # 3. Edge Analysis (Flatness)
    diff_x = np.mean(np.abs(np.diff(pixels.reshape(64,64,3), axis=1)))
    diff_y = np.mean(np.abs(np.diff(pixels.reshape(64,64,3), axis=0)))
    flatness = diff_x + diff_y

    relevance_score = 1.0
    # Thresholds: Nature usually has variety_ratio > 0.4 and is NOT grey dominant
    if variety_ratio < 0.40: relevance_score *= 0.5 # Stricter
    if is_grey_dominant: relevance_score *= 0.4
    if flatness < 60.0: relevance_score *= 0.3 # Significantly stricter flatness/entropy check

    # 4. Text/UI Detection (Sharp horizontal/vertical lines)
    # Most nature images don't have perfect 1px horizontal lines across large areas
    if variety_ratio < 0.25 and flatness < 100.0: relevance_score *= 0.2


    # Color Diagnostics (Existing water check)
    pixels_tiny = np.array(img.resize((32, 32)))
    avg_color = np.mean(pixels_tiny, axis=(0, 1))
    r, g, b = avg_color[0], avg_color[1], avg_color[2]
    is_murky = (r < 110 and g < 110 and b < 100)
    is_tinted = (g > b + 15) or (r > b + 15)
    
    bonus = 0.45 if (is_murky or is_tinted) and relevance_score > 0.5 else 0.0
    
    return relevance_score, bonus


def predict_image(image_bytes, demo_mode=True, description=""):

    """
    Hybrid Inference using PyTorch + Color Heuristics.
    """
    try:
        # Load Image
        img = Image.open(io.BytesIO(image_bytes))
        if img.mode != 'RGB':
            img = img.convert('RGB')
            
        # Optimization: Downsample very large images immediately to speed up all subsequent steps
        # AI works on 224x224, so 1024 is more than enough for detail
        if max(img.size) > 1024:
            img.thumbnail((1024, 1024), Image.Resampling.LANCZOS)
            
        relevance, color_bonus = get_scene_relevance(img)
        
        # If the image is clearly not nature/water, reject immediately
        if relevance < 0.3:
            logger.warning("Rejected non-nature / synthetic image.")
            return {"class": "invalid_image", "confidence": 0.0, "reason": "non_nature_scene"}

        model = get_model()
        
        input_tensor = _preprocess(img)
        input_batch = input_tensor.unsqueeze(0)
        
        with torch.no_grad():
            output = model(input_batch)
            
        probabilities = torch.nn.functional.softmax(output[0], dim=0)
        top_prob, top_idx = torch.max(probabilities, 0)
        top_prob = top_prob.item()
        top_idx = top_idx.item()

        final_class = "unknown"
        final_conf = 0.0

        if _is_local:
            # Use specific classes from trained model
            final_class = _categories.get(top_idx, "unknown")
            final_conf = top_prob * relevance # Scale by relevance
            
            # If it's 'clean', it's not a pollution report
            if final_class == "clean":
                final_conf = 0.05
        else:
            # Fallback to generic reasoning
            desc_lower = description.lower() if description else ""
            if "plastic" in desc_lower:
                final_class = "plastic"
                final_conf = (0.75 + color_bonus) * relevance
            elif "oil" in desc_lower or "spill" in desc_lower:
                final_class = "oil_spill"
                final_conf = (0.80 + color_bonus) * relevance
            elif "sewage" in desc_lower:
                final_class = "sewage"
                final_conf = (0.70 + color_bonus) * relevance
            elif color_bonus > 0:
                final_class = "sewage"
                final_conf = (0.5 + color_bonus) * relevance

        # Return results (clamped confidence)
        return {
            "class": final_class if final_conf > 0.2 else "unknown",
            "confidence": min(0.98, final_conf)
        }

        
    except Exception as e:
        logger.error(f"PyTorch Inference error: {e}", exc_info=True)
        return {"class": "unknown", "confidence": 0.0}
