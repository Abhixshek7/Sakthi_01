import csv
import random
from datetime import datetime

products = [
    "Juice", "Basmati Rice", "Snacks", "Coffee", "Shampoo", "Toothpaste",
    "Cooking Oil", "Biscuits", "Tea", "Salt", "Soap", "Milk", "Sugar", "Wheat", "Bathroom Essentials"
]
customers = [
    "Lucas Rossi", "Jane Smith", "Fatima Zahra", "Mohammed Ali", "Tom Müller",
    "Emily Brown", "Wei Chen", "Leslie Alexander", "Sara Lee", "Carlos Gomez",
    "David Kim", "Sofia Garcia", "Priya Patel", "Anna Ivanova", "John Doe"
]
customer_types = ["guest", "new", "regular", "vip", "affiliate", "employee", "returning", "wholesale"]
categories = ["home", "beverage", "toys", "stationery", "food", "personal care", "cleaning", "clothing", "electronics"]
payments = ["Paid", "Pending", "Partial", "Refunded", "Failed", "Unpaid", "Processing"]
statuses = ["Delivered", "Shipping", "On Hold", "Returned", "Out for Delivery", "Cancelled", "Processing"]
weeks = [f"W{i}" for i in range(1, 10)]
notification_types = ["Reminder", "Info", "Settlement", "Promotion", "Delayed", "Shipped", "Returned", "Cancelled", "Delivered"]

header = [
    "product_name", "price", "quantity_sold", "date", "customer_type", "category", "sales", "order_id",
    "customer", "payment", "status", "week", "notification_type", "notification_item", "notification_date", "notification_details"
]

rows = []
year = 2024

# Ensure at least one entry per month, then fill the rest randomly
entries_per_month = [1] * 12
for i in range(50 - 12):
    entries_per_month[random.randint(0, 11)] += 1

order_id = 20001
for month, count in enumerate(entries_per_month, 1):
    for _ in range(count):
        day = random.randint(1, 28)
        date = datetime(year, month, day)
        product = random.choice(products)
        price = round(random.uniform(20, 500), 2)
        quantity = random.randint(1, 50)
        sales = round(price * quantity, 2)
        customer = random.choice(customers)
        row = [
            product, price, quantity, date.strftime("%Y-%m-%d"), random.choice(customer_types), random.choice(categories),
            sales, order_id, customer, random.choice(payments), random.choice(statuses), random.choice(weeks),
            random.choice(notification_types), f"Order #{order_id}", date.strftime("%Y-%m-%d"), f"{random.choice(notification_types)} for {product}"
        ]
        rows.append(row)
        order_id += 1

with open("sample_50.csv", "w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f)
    writer.writerow(header)
    writer.writerows(rows)

print("sample_50.csv generated with 50 entries, all from 2024, distributed among all 12 months.")