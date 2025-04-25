from marshmallow import Schema, fields

from app.models.challenge import Challenge

class ChallengeSchema(Schema):
    id = fields.Int(dump_only=True)
    title = fields.Str(required=True)
    description = fields.Str()
    status = fields.Str()
    class Meta:
        model = Challenge
        include_fk = True 

    owner_id = fields.Int(dump_only=True)
