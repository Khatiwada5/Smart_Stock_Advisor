VALID_RISKS = {"low", "medium", "high"}
VALID_GOALS = {"short", "long"}


def normalize_choice(value):
    return value.strip().lower()


def get_decision(change, risk, goal):
    risk = normalize_choice(risk)
    goal = normalize_choice(goal)

    if risk not in VALID_RISKS:
        raise ValueError("Risk must be low, medium, or high.")

    if goal not in VALID_GOALS:
        raise ValueError("Goal must be short or long.")

    # Short-term investors usually care more about protecting quick gains.
    if goal == "short":
        if change >= 10:
            return "SELL (lock in profit)"
        if change <= -5:
            return "SELL (cut losses)"
        if risk == "high" and change <= -2:
            return "HOLD (watch closely)"
        return "HOLD"

    # Long-term investors can often tolerate more volatility.
    if change <= -15 and risk in {"medium", "high"}:
        return "BUY MORE (discount opportunity)"
    if change <= -10 and risk == "low":
        return "HOLD (avoid adding risk)"
    if change >= 20 and risk == "low":
        return "PARTIAL SELL (rebalance)"
    if change >= 30 and risk == "medium":
        return "PARTIAL SELL (take some profit)"

    return "HOLD"
