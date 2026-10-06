with open('backend/app.py', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('strat == "EMA_CROSSOVER"', 'strat == "EMA_CROSS"')

with open('backend/app.py', 'w', encoding='utf-8') as f:
    f.write(content)
print("Fixed strategy name!")
