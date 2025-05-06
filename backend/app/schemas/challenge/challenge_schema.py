from marshmallow import Schema, fields
from app.types.challenge import ChallengeStatus
from app.types.fields import EnumField
from app.models.challenge import Challenge, ChallengeStep, ChallengeStepTestcase

class ChallengeSchema(Schema):
    id = fields.Int(dump_only=True)
    title = fields.Str(required=True)
    description = fields.Str()
    status = EnumField(ChallengeStatus)

    class Meta:
        model = Challenge
        include_fk = True 

    owner_id = fields.Int(dump_only=True)

class ChallengeStepSchema(Schema):
    id = fields.Int(dump_only=True)
    challenge_id = fields.Int(required=True)
    step_number = fields.Int(required=True)
    title = fields.Str(required=True)
    description = fields.Str(required=True)

    class Meta:
        model = ChallengeStep
        include_fk = True

class UserChallengeSchema(Schema):
    id = fields.Int(dump_only=True)
    title = fields.Str(required=True)
    description = fields.Str()
    steps = fields.List(fields.Nested(ChallengeStepSchema))
    status = EnumField(ChallengeStatus)

    class Meta:
        model = Challenge
        include_fk = True

class ChallengeTestCaseSchema(Schema):
    id = fields.Int(dump_only=True)
    step_id = fields.Int(required=True)
    input = fields.Str(required=True)
    expected_output = fields.Str(required=True)

    class Meta:
        model = ChallengeStepTestcase
        include_fk = True