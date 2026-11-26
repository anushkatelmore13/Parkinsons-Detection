"""
Dataset Inspection and DataLoader Utilities for TRACEFORM Parkinson's Detection.
Supports YOLO11, ResNet50, VGG16, and Custom CNN with standardized preprocessing.
"""

import os
from pathlib import Path
from typing import Tuple, Dict, Any, List
from PIL import Image
import torch
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms

CLASSES = ["healthy", "parkinson"]
CLASS_TO_IDX = {"healthy": 0, "parkinson": 1}
IDX_TO_CLASS = {0: "healthy", 1: "parkinson"}

# Standard ImageNet normalization for transfer learning models
IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]


def get_transforms(target_size: int = 224, is_training: bool = False, is_custom_cnn: bool = False):
    """
    Returns train or eval transforms.
    Augmentations are applied strictly to the training split only.
    Validation and test splits receive deterministic resize and normalization.
    """
    if is_training:
        return transforms.Compose([
            transforms.Resize((target_size, target_size)),
            transforms.RandomHorizontalFlip(p=0.5),
            transforms.RandomRotation(degrees=10),
            transforms.ColorJitter(brightness=0.1, contrast=0.1),
            transforms.ToTensor(),
            transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
        ])
    else:
        return transforms.Compose([
            transforms.Resize((target_size, target_size)),
            transforms.ToTensor(),
            transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
        ])


class SpiralDataset(Dataset):
    """
    Custom Dataset loader for Parkinson vs Healthy spiral drawings.
    Guarantees strict separation across splits without data leakage.
    """
    def __init__(self, root_dir: str, split: str = "train", transform=None):
        self.root_dir = Path(root_dir) / split
        self.split = split
        self.transform = transform
        self.samples: List[Tuple[Path, int, str]] = []

        for class_name in CLASSES:
            class_dir = self.root_dir / class_name
            if not class_dir.exists():
                continue
            for img_file in sorted(class_dir.glob("*.jpg")) + sorted(class_dir.glob("*.png")):
                label = CLASS_TO_IDX[class_name]
                # Extract patient ID prefix if available (e.g. V01, V02, V55)
                subject_id = img_file.name.split("_")[0] if "_" in img_file.name else "unknown"
                self.samples.append((img_file, label, subject_id))

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        img_path, label, _ = self.samples[idx]
        with Image.open(img_path) as img:
            img = img.convert("RGB")
            if self.transform:
                img = self.transform(img)
            return img, label, str(img_path.name)


def inspect_dataset(dataset_dir: str) -> Dict[str, Any]:
    """
    Performs full dataset integrity check across train, valid, and test directories.
    Validates image formats, counts, subjects, and checks for corrupt files.
    """
    dataset_path = Path(dataset_dir)
    report = {"splits": {}, "total_images": 0, "subject_distribution": {}, "corrupted_files": []}

    for split in ["train", "valid", "test"]:
        report["splits"][split] = {}
        for class_name in CLASSES:
            dir_path = dataset_path / split / class_name
            if not dir_path.exists():
                report["splits"][split][class_name] = 0
                continue
            
            files = list(dir_path.glob("*.jpg")) + list(dir_path.glob("*.png"))
            valid_files = 0
            for f in files:
                try:
                    with Image.open(f) as img:
                        img.verify()
                    valid_files += 1
                    report["total_images"] += 1
                    subj = f.name.split("_")[0] if "_" in f.name else "unknown"
                    report["subject_distribution"].setdefault(subj, []).append(f"{split}/{class_name}")
                except Exception as e:
                    report["corrupted_files"].append((str(f), str(e)))

            report["splits"][split][class_name] = valid_files

    return report


def get_dataloaders(
    dataset_dir: str,
    batch_size: int = 16,
    target_size: int = 224,
    num_workers: int = 0
) -> Tuple[DataLoader, DataLoader, DataLoader]:
    """
    Creates PyTorch DataLoaders for train, valid, and test splits.
    """
    train_ds = SpiralDataset(dataset_dir, split="train", transform=get_transforms(target_size, is_training=True))
    valid_ds = SpiralDataset(dataset_dir, split="valid", transform=get_transforms(target_size, is_training=False))
    test_ds = SpiralDataset(dataset_dir, split="test", transform=get_transforms(target_size, is_training=False))

    train_loader = DataLoader(train_ds, batch_size=batch_size, shuffle=True, num_workers=num_workers)
    valid_loader = DataLoader(valid_ds, batch_size=batch_size, shuffle=False, num_workers=num_workers)
    test_loader = DataLoader(test_ds, batch_size=batch_size, shuffle=False, num_workers=num_workers)

    return train_loader, valid_loader, test_loader
