import json
from json import JSONDecodeError
from pathlib import Path

from advisor import VALID_GOALS, VALID_RISKS, get_decision

FILE = Path(__file__).with_name("portfolio.json")


def load_data():
    if not FILE.exists():
        return []

    try:
        with FILE.open("r", encoding="utf-8") as file:
            data = json.load(file)
    except JSONDecodeError:
        print("Portfolio file is not valid JSON. Starting with an empty portfolio.")
        return []

    if not isinstance(data, list):
        print("Portfolio file format is incorrect. Starting with an empty portfolio.")
        return []

    return data


def save_data(data):
    with FILE.open("w", encoding="utf-8") as file:
        json.dump(data, file, indent=4)
        file.write("\n")


def get_float_input(prompt):
    while True:
        value = input(prompt).replace("$", "").replace(",", "").strip()

        try:
            number = float(value)
        except ValueError:
            print("Invalid input. Enter a number, like 5 or 5.50.")
            continue

        if number <= 0:
            print("Price must be greater than 0.")
            continue

        return number


def get_menu_choice(prompt, valid_choices):
    while True:
        value = input(prompt).strip().lower()
        if value in valid_choices:
            return value
        print(f"Choose one of: {', '.join(sorted(valid_choices))}")


def calculate_change(buy_price, current_price):
    return round(((current_price - buy_price) / buy_price) * 100, 2)


def format_money(value):
    return f"${value:,.2f}"


def add_stock():
    name = input("Stock ticker (AAPL, TSLA): ").strip().upper()

    if not name:
        print("Stock ticker cannot be empty.")
        return

    buy_price = get_float_input("Buy price: ")
    current_price = get_float_input("Current price: ")

    stock = {
        "name": name,
        "buy": buy_price,
        "current": current_price,
        "change": calculate_change(buy_price, current_price),
    }

    data = load_data()
    data.append(stock)
    save_data(data)

    print(f"{name} added successfully.")


def view_portfolio():
    data = load_data()

    if not data:
        print("No stocks added yet.")
        return

    total_cost = sum(stock["buy"] for stock in data)
    total_value = sum(stock["current"] for stock in data)
    total_change = calculate_change(total_cost, total_value)

    print("\nYour Portfolio")
    print("-" * 72)
    print(f"{'#':<4}{'Ticker':<10}{'Buy':>14}{'Current':>14}{'Change':>12}")
    print("-" * 72)

    for index, stock in enumerate(data, 1):
        print(
            f"{index:<4}{stock['name']:<10}"
            f"{format_money(stock['buy']):>14}"
            f"{format_money(stock['current']):>14}"
            f"{stock['change']:>11.2f}%"
        )

    print("-" * 72)
    print(
        f"{'Total':<14}"
        f"{format_money(total_cost):>14}"
        f"{format_money(total_value):>14}"
        f"{total_change:>11.2f}%"
    )


def select_stock(data):
    view_portfolio()

    try:
        choice = int(input("Select stock number: "))
    except ValueError:
        print("Invalid selection.")
        return None, None

    if choice < 1 or choice > len(data):
        print("Invalid selection.")
        return None, None

    index = choice - 1
    return index, data[index]


def update_stock_price():
    data = load_data()

    if not data:
        print("No stocks to update.")
        return

    index, stock = select_stock(data)
    if stock is None:
        return

    current_price = get_float_input(f"New current price for {stock['name']}: ")
    stock["current"] = current_price
    stock["change"] = calculate_change(stock["buy"], current_price)

    save_data(data)
    print(f"{stock['name']} updated.")


def remove_stock():
    data = load_data()

    if not data:
        print("No stocks to remove.")
        return

    index, stock = select_stock(data)
    if stock is None:
        return

    confirm = input(f"Remove {stock['name']}? (y/n): ").strip().lower()
    if confirm != "y":
        print("Canceled.")
        return

    removed = data.pop(index)
    save_data(data)
    print(f"{removed['name']} removed.")


def analyze_stock():
    data = load_data()

    if not data:
        print("No stocks to analyze.")
        return

    _, stock = select_stock(data)
    if stock is None:
        return

    risk = get_menu_choice("Risk level (low/medium/high): ", VALID_RISKS)
    goal = get_menu_choice("Goal (short/long): ", VALID_GOALS)

    decision = get_decision(stock["change"], risk, goal)

    print(f"\nAnalysis for {stock['name']}")
    print(f"Change: {stock['change']:.2f}%")
    print(f"Recommendation: {decision}")


def menu():
    while True:
        print("\n==== SMART STOCK ADVISOR ====")
        print("1. Add Stock")
        print("2. View Portfolio")
        print("3. Analyze Stock")
        print("4. Update Current Price")
        print("5. Remove Stock")
        print("6. Exit")

        choice = input("Choose: ").strip()

        if choice == "1":
            add_stock()
        elif choice == "2":
            view_portfolio()
        elif choice == "3":
            analyze_stock()
        elif choice == "4":
            update_stock_price()
        elif choice == "5":
            remove_stock()
        elif choice == "6":
            print("Goodbye.")
            break
        else:
            print("Invalid option.")


if __name__ == "__main__":
    menu()
