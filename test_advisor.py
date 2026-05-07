import unittest

from advisor import get_decision
from main import calculate_change


class AdvisorDecisionTests(unittest.TestCase):
    def test_short_term_profit_suggests_sell(self):
        self.assertEqual(get_decision(12, "low", "short"), "SELL (lock in profit)")

    def test_short_term_loss_suggests_sell(self):
        self.assertEqual(get_decision(-6, "medium", "short"), "SELL (cut losses)")

    def test_long_term_high_risk_drop_suggests_buy_more(self):
        self.assertEqual(
            get_decision(-16, "high", "long"),
            "BUY MORE (discount opportunity)",
        )

    def test_long_term_low_risk_large_gain_suggests_partial_sell(self):
        self.assertEqual(
            get_decision(25, "low", "long"),
            "PARTIAL SELL (rebalance)",
        )

    def test_invalid_risk_raises_error(self):
        with self.assertRaises(ValueError):
            get_decision(5, "extreme", "short")

    def test_invalid_goal_raises_error(self):
        with self.assertRaises(ValueError):
            get_decision(5, "low", "daily")


class PortfolioMathTests(unittest.TestCase):
    def test_calculate_change_for_gain(self):
        self.assertEqual(calculate_change(100, 125), 25.0)

    def test_calculate_change_for_loss(self):
        self.assertEqual(calculate_change(80, 60), -25.0)


if __name__ == "__main__":
    unittest.main()
