"""
VGG16 implementation with Transfer Learning and Fine-Tuning.
Architecture:
- Pretrained ImageNet VGG16 base
- Custom dense classification head with Dropout & regularization
- Staged training: Freeze features -> Train head -> Fine-tune last convolutional block
"""

import torch
import torch.nn as nn
from torchvision.models import vgg16, VGG16_Weights


def build_vgg16(num_classes: int = 2, freeze_backbone: bool = True, pretrained: bool = True) -> nn.Module:
    weights = VGG16_Weights.DEFAULT if pretrained else None
    model = vgg16(weights=weights)

    if freeze_backbone:
        for param in model.features.parameters():
            param.requires_grad = False

    # Replace classifier (original: 25088 -> 4096 -> 4096 -> 1000)
    model.classifier = nn.Sequential(
        nn.Linear(512 * 7 * 7, 512),
        nn.ReLU(inplace=True),
        nn.Dropout(p=0.5),
        nn.Linear(512, 128),
        nn.ReLU(inplace=True),
        nn.Dropout(p=0.3),
        nn.Linear(128, num_classes)
    )

    return model


def unfreeze_vgg16_layers(model: nn.Module, num_layers_to_unfreeze: int = 6):
    """
    Unfreezes the top conv layers (Block 5) of VGG16 for fine-tuning.
    """
    total_layers = len(model.features)
    for idx, layer in enumerate(model.features):
        if idx >= total_layers - num_layers_to_unfreeze:
            for param in layer.parameters():
                param.requires_grad = True
