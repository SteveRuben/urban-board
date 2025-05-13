from flask import abort
from sqlalchemy import Integer, String, Text, Boolean, Float
import uuid

def validate_model_data(model_class, data):
    errors = {}

    for column in model_class.__table__.columns:
        column_name = column.name

        # Ne pas valider les colonnes auto-générées (ex: id)
        if column.primary_key and column.autoincrement:
            continue

        # Vérifie si la colonne est requise
        if not column.nullable and column_name not in data:
            errors[column_name] = "Ce champ est requis."
            continue

        # Si la donnée est présente, vérifier le type
        if column_name in data:
            value = data[column_name]
            column_type = type(column.type)

            if column_type == Integer and not isinstance(value, int):
                errors[column_name] = "Doit être un entier."
            elif column_type in [String, Text] and not isinstance(value, str):
                errors[column_name] = "Doit être une chaîne de caractères."
            elif column_type == Boolean and not isinstance(value, bool):
                errors[column_name] = "Doit être un booléen."
            elif column_type == Float and not isinstance(value, (float, int)):
                errors[column_name] = "Doit être un nombre réel."
            elif column_type.__name__ == 'UUID' and not isinstance(value, (str, uuid.UUID)):
                errors[column_name] = "Doit être un UUID valide."

    if errors:
        abort(400, description={"erreurs": errors})
