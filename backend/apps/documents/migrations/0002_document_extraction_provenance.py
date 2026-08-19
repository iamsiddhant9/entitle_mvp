"""Extraction provenance, quality and expiry fields for Document.

Purely additive: every new field has a default or is nullable, so existing rows remain
valid. The only altered field is `file`, whose `upload_to` becomes a callable that
generates a safe filename — this affects newly uploaded files only and leaves the stored
paths of existing files untouched.
"""

import apps.documents.models
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('documents', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='document',
            name='blur_score',
            field=models.FloatField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='document',
            name='confirmed_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='document',
            name='expiry_date',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='document',
            name='expiry_status',
            field=models.CharField(choices=[('not_applicable', 'Not applicable'), ('valid', 'Valid'), ('expired', 'Expired'), ('unknown', 'Unable to determine')], default='not_applicable', max_length=32),
        ),
        migrations.AddField(
            model_name='document',
            name='extraction_error',
            field=models.CharField(blank=True, default='', max_length=64),
        ),
        migrations.AddField(
            model_name='document',
            name='extraction_model',
            field=models.CharField(blank=True, default='', max_length=64),
        ),
        migrations.AddField(
            model_name='document',
            name='extraction_source',
            field=models.CharField(choices=[('none', 'No extracted data'), ('groq_vision', 'Gemini Vision'), ('human', 'Human confirmed')], default='none', max_length=32),
        ),
        migrations.AddField(
            model_name='document',
            name='extraction_status',
            field=models.CharField(choices=[('pending', 'Pending'), ('success', 'Extracted successfully'), ('failed', 'Extraction failed'), ('not_configured', 'Extraction not configured'), ('unsupported_doc_type', 'No extraction schema for this document type'), ('skipped_low_quality', 'Skipped: image quality too low')], default='pending', max_length=32),
        ),
        migrations.AddField(
            model_name='document',
            name='profile_mapping_json',
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.AddField(
            model_name='document',
            name='quality_status',
            field=models.CharField(choices=[('ok', 'Acceptable'), ('blurry', 'Too blurry or blank to read'), ('too_small', 'Resolution too low to assess'), ('unknown', 'Unable to assess')], default='unknown', max_length=32),
        ),
        migrations.AlterField(
            model_name='document',
            name='file',
            field=models.FileField(upload_to=apps.documents.models.document_upload_path),
        ),
    ]
