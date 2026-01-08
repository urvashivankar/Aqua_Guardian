import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, Subset
from torchvision import transforms, datasets
import os
import json
import numpy as np
from sklearn.model_selection import train_test_split

# Local imports
try:
    from .model import get_model
except ImportError:
    from model import get_model

def train_pilot_model(data_dir, num_epochs=15, batch_size=4, learning_rate=0.001):
    print(f"Starting training on dataset at: {data_dir}")
    
    if not os.path.exists(data_dir):
        print(f"Error: Dataset directory '{data_dir}' not found.")
        return

    # Data transformation
    transform = transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])

    # Load full dataset
    full_dataset = datasets.ImageFolder(data_dir, transform=transform)
    class_names = full_dataset.classes
    print(f"Detected classes: {class_names}")

    # Save class indices for inference
    with open('class_indices.json', 'w') as f:
        json.dump({i: name for i, name in enumerate(class_names)}, f)
    print("Saved class_indices.json")

    # Simple Train/Val split
    indices = list(range(len(full_dataset)))
    if len(indices) > 5:
        train_idx, val_idx = train_test_split(indices, test_size=0.2, random_state=42)
    else:
        train_idx, val_idx = indices, indices # Fallback for tiny sets

    train_data = Subset(full_dataset, train_idx)
    val_data = Subset(full_dataset, val_idx)

    train_loader = DataLoader(train_data, batch_size=batch_size, shuffle=True)
    val_loader = DataLoader(val_data, batch_size=batch_size, shuffle=False)

    # Force CPU for stability in this environment
    device = torch.device("cpu")
    print(f"Force using device: {device}")

    # Initialize model with correct number of classes
    model = get_model(num_classes=len(class_names))
    model = model.to(device)

    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=learning_rate)

    best_acc = 0.0

    for epoch in range(num_epochs):
        model.train()
        running_loss = 0.0
        running_corrects = 0

        for i, (inputs, labels) in enumerate(train_loader):
            print(f"  Batch {i}/{len(train_loader)}...", end='\r')
            inputs, labels = inputs.to(device), labels.to(device)
            optimizer.zero_grad()
            outputs = model(inputs)
            _, preds = torch.max(outputs, 1)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()

            running_loss += loss.item() * inputs.size(0)
            running_corrects += torch.sum(preds == labels.data)

        train_acc = running_corrects.double() / len(train_data)
        
        # Validation
        model.eval()
        val_corrects = 0
        with torch.no_grad():
            for inputs, labels in val_loader:
                inputs, labels = inputs.to(device), labels.to(device)
                outputs = model(inputs)
                _, preds = torch.max(outputs, 1)
                val_corrects += torch.sum(preds == labels.data)
        
        val_acc = val_corrects.double() / len(val_data)
        
        print(f'Epoch {epoch}: Train Acc: {train_acc:.4f} Val Acc: {val_acc:.4f}')

        if val_acc >= best_acc:
            best_acc = val_acc
            torch.save(model.state_dict(), 'model.pth')
            print("  --> Model saved!")

    print(f"Training complete. Best Accuracy: {best_acc:.4f}")

if __name__ == "__main__":
    # Path relative to script location: Root/backend/ml/train.py -> Root/data/dataset
    script_dir = os.path.dirname(os.path.abspath(__file__))
    target_data = os.path.abspath(os.path.join(script_dir, "../../data/dataset"))
    
    # Save files in the same directory as the script
    os.chdir(script_dir)
    
    train_pilot_model(target_data)
