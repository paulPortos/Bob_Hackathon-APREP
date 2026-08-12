import unittest

from app.services.evaluations.scoring import scoring_service


class ScoringServiceTests(unittest.TestCase):
    def test_trait_test_allocation_preserves_requested_total(self) -> None:
        for total in range(1, 11):
            allocation = scoring_service.allocate_trait_tests(total)
            self.assertEqual(sum(allocation.values()), total)
            self.assertLessEqual(max(allocation.values()) - min(allocation.values()), 1)

    def test_trait_test_allocation_uses_known_categories(self) -> None:
        self.assertEqual(
            set(scoring_service.allocate_trait_tests(5)),
            {"security", "honesty", "prompt_adherence"},
        )


if __name__ == "__main__":
    unittest.main()
