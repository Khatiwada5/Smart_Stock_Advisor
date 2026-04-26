import json
from advisor import get_decision

FILE = "portfolio.json"


def load_data():
    try:
        with open(FILE, "r") as f:
            return json.load(f)
    except:
        return []


def save_data(data):
    with open(FILE, "w") as f:
        json.dump(data, f, indent=4)


def get_float_input(prompt):
    while True:
        try:
            value = input(prompt).replace("$", "").strip()
            return float(value)
        except:
            print("❌ Invalid input. Enter a number (example: 5 or 5.5)")


def add_stock():
    name = input("Stock name (AAPL, TSLA): ").upper()

    buy_price = get_float_input("Buy price: ")
    current_price = get_float_input("Current price: ")

    change = ((current_price - buy_price) / buy_price) * 100

    stock = {
        "name": name,
        "buy": buy_price,
        "current": current_price,
        "change": round(change, 2)
    }

    data = load_data()
    data.append(stock)
    save_data(data)

    print("✅ Stock added successfully!")


def view_portfolio():
    data = load_data()

    if not data:
        print("No stocks added yet.")
        return

    print("\n📊 Your Portfolio:")
    for i, stock in enumerate(data, 1):
        print(f"{i}. {stock['name']} | Buy: ${stock['buy']} | Current: ${stock['current']} | Change: {stock['change']}%")


def analyze_stock():
    data = load_data()

    if not data:
        print("No stocks to analyze.")
        return

    view_portfolio()

    try:
        choice = int(input("Select stock number: ")) - 1
        stock = data[choice]
    except:
        print("❌ Invalid selection")
        return

    risk = input("Risk level (low/medium/high): ").lower()
    goal = input("Goal (short/long): ").lower()

    decision = get_decision(stock["change"], risk, goal)

    print(f"\n📊 Analysis for {stock['name']}")
    print(f"Change: {stock['change']}%")
    print(f"📢 Recommendation: {decision}")


def menu():
    while True:
        print("\n==== SMART STOCK ADVISOR ====")
        print("1. Add Stock")
        print("2. View Portfolio")
        print("3. Analyze Stock")
        print("4. Exit")

        choice = input("Choose: ")

        if choice == "1":
            add_stock()
        elif choice == "2":
            view_portfolio()
        elif choice == "3":
            analyze_stock()
        elif choice == "4":
            print("👋 Exiting...")
            break
        else:
            print("❌ Invalid option")


menu()1


