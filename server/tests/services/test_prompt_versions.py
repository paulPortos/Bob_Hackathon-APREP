import unittest

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base
from app.models import Evaluation, Project, User
from app.schemas.projects.prompt import PromptCreate
from app.services.projects.prompt import PromptService


class PromptVersionTests(unittest.TestCase):
    def setUp(self) -> None:
        self.engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(self.engine)
        self.db = sessionmaker(bind=self.engine)()

        self.user = User(email="owner@example.com", hashed_password="hash")
        self.db.add(self.user)
        self.db.flush()
        self.project = Project(
            user_id=self.user.id,
            name="Agent",
            endpoint_url="https://agent.example.com",
            requires_token=False,
            request_body_template='{"message": "{{message}}"}',
            response_path="answer",
        )
        self.db.add(self.project)
        self.db.commit()

    def tearDown(self) -> None:
        self.db.close()
        self.engine.dispose()

    def test_editing_an_evaluated_prompt_creates_a_new_version(self) -> None:
        service = PromptService(self.db)
        original = service.save(
            self.project.id,
            self.user.id,
            PromptCreate(content="Original system prompt", file_type="txt"),
        )
        evaluation = Evaluation(
            project_id=self.project.id,
            prompt_id=original.id,
            slot_id="question-set",
            status="completed",
        )
        self.db.add(evaluation)
        self.db.commit()

        current = service.save(
            self.project.id,
            self.user.id,
            PromptCreate(content="Updated system prompt", file_type="txt"),
        )

        self.assertNotEqual(current.id, original.id)
        self.assertEqual(evaluation.prompt_id, original.id)
        self.assertEqual(evaluation.prompt.content, "Original system prompt")
        self.assertEqual(service.get(self.project.id, self.user.id).id, current.id)


if __name__ == "__main__":
    unittest.main()
