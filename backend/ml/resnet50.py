"""
ResNet50 implementation with Transfer Learning and Fine-Tuning.
Architecture:
- Pretrained ImageNet ResNet50 backbone
- Custom classification head with Dropout & BatchNorm
- Staged training: Freeze backbone -> Train head -> Fine-tune layer4 with lower learning rate
"""

import torch
import torch.nn as nn
from torchvision.models import resnet50, ResNet50_Weights


def build_resnet50(num_classes: int = 2, freeze_backbone: bool = True, pretrained: bool = True) -> nn.Module:
    weights = ResNet50_Weights.DEFAULT if pretrained else None
    model = resnet50(weights=weights)

    if freeze_backbone:
        for param in model.parameters():
            param.requires_grad = False

    # Extract original in_features (2048)
    in_features = model.fc.in_features

    # Custom task-specific head
    model.fc = nn.Sequential(
        nn.Dropout(p=0.5),
        nn.Linear(in_features, 256),
        nn.BatchNorm1d(256),
        nn.ReLU(inplace=True),
        nn.Dropout(p=0.3),
        nn.Linear(256, num_classes)
    )

    return model


def unfreeze_resnet50_layers(model: nn.Module, unfreeze_from_layer: str = "layer4"):
    """
    Unfreezes layer4 and head for fine-tuning.
    Earlier convolutional layers remain frozen to preserve low-level features.
    """
    unfreeze = False
    for name, child in model.named_children():
        if name == unfreeze_from_layer:
            unfreeze = True
        if unfreeze:
            for param in child.parameters():
                param.requires_grad = True
