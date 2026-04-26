def get_decision(change, risk, goal):

    # SHORT TERM STRATEGY
    if goal == "short":
        if change > 10:
            return "SELL (Lock in profit)"
        elif change < -5:
            return "SELL (Cut losses)"
        else:
            return "HOLD"

    # LONG TERM STRATEGY
    elif goal == "long":
        if change < -10:
            return "BUY MORE (Discount opportunity)"
        elif change > 20 and risk == "low":
            return "PARTIAL SELL"
        else:
            return "HOLD"

    return "HOLD"