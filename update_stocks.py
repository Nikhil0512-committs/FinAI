import re

with open("c:/Users/nikhi.NIKHIL/Downloads/FinAI/backend/database.py", "r", encoding="utf-8") as f:
    content = f.read()

new_stocks = [
    {'symbol': 'LTIM', 'name': 'LTIMindtree Ltd.', 'sector': 'IT Services', 'exchange': 'NSE'},
    {'symbol': 'DMART', 'name': 'Avenue Supermarts Ltd.', 'sector': 'Retail', 'exchange': 'NSE'},
    {'symbol': 'HDFCAMC', 'name': 'HDFC Asset Management Company', 'sector': 'Financial Services', 'exchange': 'NSE'},
    {'symbol': 'SRF', 'name': 'SRF Ltd.', 'sector': 'Chemicals', 'exchange': 'NSE'},
    {'symbol': 'PAGEIND', 'name': 'Page Industries Ltd.', 'sector': 'Textiles', 'exchange': 'NSE'},
    {'symbol': 'SHREECEM', 'name': 'Shree Cement Ltd.', 'sector': 'Cement', 'exchange': 'NSE'},
    {'symbol': 'AMBUJACEM', 'name': 'Ambuja Cements Ltd.', 'sector': 'Cement', 'exchange': 'NSE'},
    {'symbol': 'INDIGO', 'name': 'InterGlobe Aviation Ltd.', 'sector': 'Aviation', 'exchange': 'NSE'},
    {'symbol': 'TORNTPHARM', 'name': 'Torrent Pharmaceuticals', 'sector': 'Pharmaceuticals', 'exchange': 'NSE'},
    {'symbol': 'LUPIN', 'name': 'Lupin Ltd.', 'sector': 'Pharmaceuticals', 'exchange': 'NSE'},
    {'symbol': 'AUROPHARMA', 'name': 'Aurobindo Pharma', 'sector': 'Pharmaceuticals', 'exchange': 'NSE'},
    {'symbol': 'ICICIPRULI', 'name': 'ICICI Prudential Life', 'sector': 'Life Insurance', 'exchange': 'NSE'},
    {'symbol': 'ICICIGI', 'name': 'ICICI Lombard General', 'sector': 'General Insurance', 'exchange': 'NSE'},
    {'symbol': 'MUTHOOTFIN', 'name': 'Muthoot Finance Ltd.', 'sector': 'Financial Services', 'exchange': 'NSE'},
    {'symbol': 'BERGEPAINT', 'name': 'Berger Paints India Ltd.', 'sector': 'Paints', 'exchange': 'NSE'},
    {'symbol': 'HAVELLS', 'name': 'Havells India Ltd.', 'sector': 'Electricals', 'exchange': 'NSE'},
    {'symbol': 'VOLTAS', 'name': 'Voltas Ltd.', 'sector': 'Consumer Durables', 'exchange': 'NSE'},
    {'symbol': 'BOSCHLTD', 'name': 'Bosch Ltd.', 'sector': 'Auto Components', 'exchange': 'NSE'},
    {'symbol': 'MRF', 'name': 'MRF Ltd.', 'sector': 'Tyres', 'exchange': 'NSE'},
    {'symbol': 'MARICO', 'name': 'Marico Ltd.', 'sector': 'FMCG', 'exchange': 'NSE'},
    {'symbol': 'DABUR', 'name': 'Dabur India Ltd.', 'sector': 'FMCG', 'exchange': 'NSE'},
    {'symbol': 'GODREJCP', 'name': 'Godrej Consumer Products', 'sector': 'FMCG', 'exchange': 'NSE'},
    {'symbol': 'TATACHEM', 'name': 'Tata Chemicals Ltd.', 'sector': 'Chemicals', 'exchange': 'NSE'},
    {'symbol': 'UPL', 'name': 'UPL Ltd.', 'sector': 'Agrochemicals', 'exchange': 'NSE'},
    {'symbol': 'PIIND', 'name': 'PI Industries Ltd.', 'sector': 'Agrochemicals', 'exchange': 'NSE'},
    {'symbol': 'AUBANK', 'name': 'AU Small Finance Bank', 'sector': 'Banking', 'exchange': 'NSE'},
    {'symbol': 'FEDERALBNK', 'name': 'Federal Bank Ltd.', 'sector': 'Banking', 'exchange': 'NSE'},
    {'symbol': 'IDFCFIRSTB', 'name': 'IDFC First Bank', 'sector': 'Banking', 'exchange': 'NSE'},
    {'symbol': 'PNB', 'name': 'Punjab National Bank', 'sector': 'Public Banking', 'exchange': 'NSE'},
    {'symbol': 'BOB', 'name': 'Bank of Baroda', 'sector': 'Public Banking', 'exchange': 'NSE'},
    {'symbol': 'CANBK', 'name': 'Canara Bank', 'sector': 'Public Banking', 'exchange': 'NSE'},
    {'symbol': 'RECLTD', 'name': 'REC Ltd.', 'sector': 'Power Finance', 'exchange': 'NSE'},
    {'symbol': 'PFC', 'name': 'Power Finance Corp', 'sector': 'Power Finance', 'exchange': 'NSE'},
    {'symbol': 'IRCTC', 'name': 'IRCTC Ltd.', 'sector': 'Travel & Tourism', 'exchange': 'NSE'},
    {'symbol': 'CONCOR', 'name': 'Container Corporation', 'sector': 'Logistics', 'exchange': 'NSE'},
    {'symbol': 'BHEL', 'name': 'Bharat Heavy Electricals', 'sector': 'Heavy Electricals', 'exchange': 'NSE'},
    {'symbol': 'GAIL', 'name': 'GAIL (India) Ltd.', 'sector': 'Gas Transmission', 'exchange': 'NSE'},
    {'symbol': 'IGL', 'name': 'Indraprastha Gas Ltd.', 'sector': 'City Gas', 'exchange': 'NSE'},
    {'symbol': 'PETRONET', 'name': 'Petronet LNG Ltd.', 'sector': 'Gas Transmission', 'exchange': 'NSE'},
    {'symbol': 'BIOCON', 'name': 'Biocon Ltd.', 'sector': 'Biotechnology', 'exchange': 'NSE'},
    {'symbol': 'SYNGENE', 'name': 'Syngene International', 'sector': 'Biotechnology', 'exchange': 'NSE'},
]

# Find the end of CURATED_INDIAN_STOCKS list
pattern = r"(CURATED_INDIAN_STOCKS\s*=\s*\[.*?)(\s*\]\n)"
match = re.search(pattern, content, re.DOTALL)

if match:
    existing_list_str = match.group(1)
    
    # generate string for new stocks
    new_stocks_str = ",\n".join(["        " + str(s) for s in new_stocks])
    
    # insert
    new_content = existing_list_str + ",\n" + new_stocks_str + match.group(2)
    final_content = content[:match.start()] + new_content + content[match.end():]
    
    with open("c:/Users/nikhi.NIKHIL/Downloads/FinAI/backend/database.py", "w", encoding="utf-8") as f:
        f.write(final_content)
    print(f"Successfully added {len(new_stocks)} stocks to database.py")
else:
    print("Could not find CURATED_INDIAN_STOCKS in database.py")
