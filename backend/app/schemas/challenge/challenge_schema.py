from marshmallow import Schema, fields
from app.types.challenge import ChallengeStatus
from app.types.fields import EnumField
from app.models.challenge import Challenge

class ChallengeSchema(Schema):
    id = fields.Int(dump_only=True)
    title = fields.Str(required=True)
    description = fields.Str()
    status = EnumField(ChallengeStatus)

    class Meta:
        model = Challenge
        include_fk = True 

    owner_id = fields.Int(dump_only=True)
