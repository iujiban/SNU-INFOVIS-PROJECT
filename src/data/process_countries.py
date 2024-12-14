import json
import os

def load_json_file(filepath):
    with open(filepath, 'r') as f:
        return json.load(f)

def get_unique_countries(data):
    countries = set()
    if isinstance(data, list):
        for item in data:
            if isinstance(item, dict) and "Country/Territory" in item:
                countries.add(item["Country/Territory"])
    return countries

# Manual mapping for special cases
special_cases = {
    "Andorra": "Europe",
    "Angola": "Africa",
    "Antigua and Barbuda": "North America",
    "Aruba": "North America",
    "Bahrain": "Asia",
    "Benin": "Africa",
    "Cameroon": "Africa",
    "China, Hong Kong SAR": "Asia",
    "China, Macao SAR": "Asia",
    "Gambia": "Africa",
    "Gibraltar": "Europe",
    "Guinea": "Africa",
    "Guinea-Bissau": "Africa",
    "Iraq": "Asia",
    "Ireland and Northern Ireland": "Europe",
    "Jordan": "Asia",
    "Mali": "Africa",
    "Mauritania": "Africa",
    "Mongolia": "Asia",
    "Mozambique": "Africa",
    "Namibia": "Africa",
    "Netherlands": "Europe",
    "Oman": "Asia",
    "Qatar": "Asia",
    "State of Palestine": "Asia",
    "Sudan": "Africa",
    "Timor-Leste": "Asia",
    "United Kingdom": "Europe",
    "United Kingdom (England)": "Europe",
    "United Kingdom (England and Wales)": "Europe",
    "United Republic of Tanzania": "Africa",
    "Yemen": "Asia"
}

# Load all data files
data_dir = os.path.dirname(__file__)
all_countries = set()

# Process each JSON file
for filename in os.listdir(data_dir):
    if filename.endswith('.json') and filename != 'continents.json':
        filepath = os.path.join(data_dir, filename)
        data = load_json_file(filepath)
        countries = get_unique_countries(data)
        all_countries.update(countries)

# Load continents data
continents_file = os.path.join(data_dir, 'continents.json')
continents_data = load_json_file(continents_file)

# Create a mapping of country names by continent
country_by_continent = {
    "Africa": [],
    "Antarctica": [],
    "Asia": [],
    "Europe": [],
    "North America": [],
    "South America": [],
    "Oceania": []
}

# Sort countries into continents based on the data files and special cases
for country in sorted(all_countries):
    if country in special_cases:
        continent = special_cases[country]
        country_by_continent[continent].append(country)
        continue

    found = False
    for filename in os.listdir(data_dir):
        if filename.endswith('.json') and filename != 'continents.json':
            filepath = os.path.join(data_dir, filename)
            data = load_json_file(filepath)
            for item in data:
                if isinstance(item, dict) and item.get("Country/Territory") == country:
                    region = item.get("Region")
                    if region == "Americas":
                        subregion = item.get("SubRegion")
                        if subregion in ["North America", "Central America", "Caribbean"]:
                            country_by_continent["North America"].append(country)
                        elif subregion == "South America":
                            country_by_continent["South America"].append(country)
                    elif region in country_by_continent:
                        country_by_continent[region].append(country)
                    found = True
                    break
            if found:
                break
    
    if not found:
        print(f"Warning: Could not determine continent for {country}")

# Update continents.json
for continent in continents_data:
    continent_name = continent["continent_name"]
    if continent_name in country_by_continent:
        # Preserve existing countries list
        if "countries" not in continent:
            continent["countries"] = []
        # Add new country_names list
        continent["country_names"] = sorted(list(set(country_by_continent[continent_name])))

# Write updated continents.json
with open(continents_file, 'w') as f:
    json.dump(continents_data, f, indent=4)

print("Updated continents.json with country names")
