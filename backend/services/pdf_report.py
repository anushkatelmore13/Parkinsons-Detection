import io
from pathlib import Path
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image as RLImage, HRFlowable
from reportlab.lib.units import inch

def generate_prediction_pdf(record: dict) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )

    styles = getSampleStyleSheet()
    
    # Custom styles adhering to TRACEFORM identity
    primary_color = colors.HexColor('#101110')
    accent_lime = colors.HexColor('#6B9A0E')      # Darker lime for print contrast
    accent_purple = colors.HexColor('#6B46C1')    # Darker purple for print
    muted_grey = colors.HexColor('#4A4D45')
    light_bg = colors.HexColor('#F8F9F6')
    border_grey = colors.HexColor('#D5D8CF')

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=primary_color,
        spaceAfter=4
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=muted_grey,
        spaceAfter=15
    )

    heading_style = ParagraphStyle(
        'SectionHeading',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=primary_color,
        spaceBefore=12,
        spaceAfter=6
    )

    body_style = ParagraphStyle(
        'BodyDark',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=primary_color
    )

    meta_style = ParagraphStyle(
        'MetaText',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=8,
        leading=11,
        textColor=muted_grey
    )

    disclaimer_style = ParagraphStyle(
        'DisclaimerText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor('#7B2D26')
    )

    story = []

    # 1. Header
    story.append(Paragraph("TRACEFORM — VISUAL INTELLIGENCE LAB", title_style))
    story.append(Paragraph("EXPERIMENTAL IMAGE CLASSIFICATION REPORT · RESEARCH USE ONLY", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=primary_color, spaceAfter=15))

    # 2. Executive Summary Box
    is_healthy = record.get('predicted_class') == 'healthy'
    class_color = accent_lime if is_healthy else accent_purple
    pred_label = record.get('predicted_class', 'UNKNOWN').upper()
    confidence = float(record.get('confidence', 0.0)) * 100

    summary_data = [
        [
            Paragraph("<b>EXPERIMENT ID:</b>", body_style),
            Paragraph(f"TF-{record.get('id', 'N/A'):04d}" if isinstance(record.get('id'), int) else str(record.get('id')), body_style),
            Paragraph("<b>TIMESTAMP (UTC):</b>", body_style),
            Paragraph(str(record.get('timestamp', 'N/A')), body_style)
        ],
        [
            Paragraph("<b>PREDICTED CLASS:</b>", body_style),
            Paragraph(f"<b><font color='{class_color.hexval()}'>{pred_label}</font></b>", body_style),
            Paragraph("<b>CONFIDENCE:</b>", body_style),
            Paragraph(f"<b>{confidence:.2f}%</b>", body_style)
        ],
        [
            Paragraph("<b>MODEL USED:</b>", body_style),
            Paragraph(str(record.get('model_used', 'Ultralytics YOLO11n-cls')), body_style),
            Paragraph("<b>INFERENCE TIME:</b>", body_style),
            Paragraph(f"{record.get('inference_time_ms', 0):.2f} ms", body_style)
        ],
        [
            Paragraph("<b>INPUT IMAGE:</b>", body_style),
            Paragraph(str(record.get('filename', 'Unknown')), body_style),
            Paragraph("<b>CLASS DISTRIBUTION:</b>", body_style),
            Paragraph(f"H: {float(record.get('healthy_prob', 0))*100:.2f}% | P: {float(record.get('parkinson_prob', 0))*100:.2f}%", body_style)
        ]
    ]

    summary_table = Table(summary_data, colWidths=[110, 150, 110, 160])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), light_bg),
        ('GRID', (0,0), (-1,-1), 0.5, border_grey),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(summary_table)
    story.append(Spacer(1, 15))

    # 3. Image & Probability Visualization
    story.append(Paragraph("SPECIMEN & PROBABILITY PROFILE", heading_style))
    img_path = record.get('image_path')
    img_element = None
    if img_path and Path(img_path).exists():
        try:
            img_element = RLImage(img_path, width=160, height=160)
        except Exception:
            img_element = Paragraph("[Image preview unavailable]", meta_style)
    else:
        img_element = Paragraph("[Image file not stored]", meta_style)

    prob_h = float(record.get('healthy_prob', 0.0)) * 100
    prob_p = float(record.get('parkinson_prob', 0.0)) * 100

    details_text = f"""
    <b>Analyzed Pattern:</b> Spiral Drawing Drawing Examination<br/>
    <b>Healthy Pattern Probability:</b> {prob_h:.2f}%<br/>
    <b>Parkinson Pattern Probability:</b> {prob_p:.2f}%<br/>
    <br/>
    <b>Technical Analysis:</b><br/>
    The deep neural network processed the input drawing resized to 640x640 with aspect-ratio preserving letterbox padding. Features extracted via the CSPDarknet feature extractor were passed through spatial pyramid pooling and the classification head. The resulting logits were normalized via softmax into the class probabilities recorded above.
    """

    profile_table = Table([
        [img_element, Paragraph(details_text, body_style)]
    ], colWidths=[180, 350])
    profile_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(profile_table)
    story.append(Spacer(1, 15))

    # 4. Model Architecture & Validation Context
    story.append(Paragraph("TRAINING & VALIDATION SPECIFICATIONS", heading_style))
    model_name = str(record.get('model_used', 'Ultralytics YOLO11n-cls'))
    model_data = [
        [Paragraph("<b>Architecture</b>", body_style), Paragraph(model_name, body_style)],
        [Paragraph("<b>Model Family</b>", body_style), Paragraph("Multi-Model Vision Suite (YOLO11 / ResNet50 / VGG16 / Custom CNN)", body_style)],
        [Paragraph("<b>Input Resolution</b>", body_style), Paragraph("224 × 224 (PyTorch Backbones) / 640 × 640 (YOLO11)", body_style)],
        [Paragraph("<b>Optimization</b>", body_style), Paragraph("AdamW / SGD with fine-tuned staged unfreezing & cosine LR", body_style)],
        [Paragraph("<b>Validation Metrics (Held-out Test)</b>", body_style), Paragraph("Multi-architecture benchmarked on held-out test split (n=40)", body_style)],
        [Paragraph("<b>Dataset Provenance</b>", body_style), Paragraph("Roboflow Parkinson Disease Detection v1 (204 total spiral drawings)", body_style)]
    ]
    model_table = Table(model_data, colWidths=[160, 370])
    model_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,-1), light_bg),
        ('GRID', (0,0), (-1,-1), 0.5, border_grey),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(model_table)
    story.append(Spacer(1, 15))

    # 5. Methodological & Research Notes (Subject Leakage Note)
    story.append(Paragraph("ACADEMIC & METHODOLOGY DISCLOSURE", heading_style))
    leakage_note = (
        "<b>Subject-Wise Leakage Risk:</b> In accordance with standard AI reporting guidelines (CLAIM 2024, TRIPOD+AI), "
        "it is noted that the original dataset contains participant identifiers (e.g., V01, V02) distributed across train and test splits. "
        "Consequently, image-level test accuracy may overestimate generalization to unseen patients. "
        "Subject-independent k-fold cross-validation is recommended for formal clinical study."
    )
    story.append(Paragraph(leakage_note, meta_style))
    story.append(Spacer(1, 12))

    # 6. Ethical & Responsible-Use Disclaimer
    story.append(HRFlowable(width="100%", thickness=0.8, color=colors.HexColor('#DC2626'), spaceAfter=8))
    disclaimer_text = (
        "<b>IMPORTANT ETHICAL & REGULATORY DISCLAIMER:</b><br/>"
        "TRACEFORM is an academic research demonstration and experimentation platform. "
        "This software and its generated reports ARE NOT MEDICAL DEVICES and have NOT been approved, cleared, or evaluated "
        "by the FDA, EMA, or any national health authority for clinical diagnosis, patient screening, or medical prognosis. "
        "All classifications represent statistical probabilities computed by an experimental deep neural network on a restricted image corpus. "
        "This report must NEVER be used as a substitute for professional clinical evaluation by a licensed neurologist or healthcare provider."
    )
    story.append(Paragraph(disclaimer_text, disclaimer_style))

    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()
