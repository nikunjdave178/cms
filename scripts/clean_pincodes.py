"""Clean the data.gov.in All-India Pincode Directory into pincode,city,state.

Input : raw API CSV chunks (circlename,...,officename,pincode,officetype,delivery,district,statename,lat,lng)
Output: backend/CmsApi/Data/Seed/pincodes.csv with one row per unique pincode.

Cleaning rules:
- keep only valid 6-digit pincodes (first digit 1-9)
- drop rows with blank/NA district or state
- city = district name, title-cased with roman numerals/initials preserved
- state normalized to canonical Indian state/UT names
- one row per pincode: majority (city, state) vote across its post offices
"""
import csv
import glob
import re
import sys
from collections import Counter, defaultdict

RAW_GLOB = sys.argv[1] if len(sys.argv) > 1 else 'pin_chunk_*.csv'
OUT_PATH = sys.argv[2] if len(sys.argv) > 2 else 'pincodes.csv'

STATE_CANONICAL = {
    'ANDAMAN AND NICOBAR ISLANDS': 'Andaman and Nicobar Islands',
    'ANDAMAN & NICOBAR ISLANDS': 'Andaman and Nicobar Islands',
    'A & N ISLANDS': 'Andaman and Nicobar Islands',
    'ANDHRA PRADESH': 'Andhra Pradesh',
    'ARUNACHAL PRADESH': 'Arunachal Pradesh',
    'ASSAM': 'Assam',
    'BIHAR': 'Bihar',
    'CHANDIGARH': 'Chandigarh',
    'CHATTISGARH': 'Chhattisgarh',
    'CHHATTISGARH': 'Chhattisgarh',
    'DADRA AND NAGAR HAVELI AND DAMAN AND DIU': 'Dadra and Nagar Haveli and Daman and Diu',
    'THE DADRA AND NAGAR HAVELI AND DAMAN AND DIU': 'Dadra and Nagar Haveli and Daman and Diu',
    'DADRA & NAGAR HAVELI': 'Dadra and Nagar Haveli and Daman and Diu',
    'DAMAN & DIU': 'Dadra and Nagar Haveli and Daman and Diu',
    'DAMAN AND DIU': 'Dadra and Nagar Haveli and Daman and Diu',
    'DELHI': 'Delhi',
    'NEW DELHI': 'Delhi',
    'GOA': 'Goa',
    'GUJARAT': 'Gujarat',
    'HARYANA': 'Haryana',
    'HIMACHAL PRADESH': 'Himachal Pradesh',
    'JAMMU AND KASHMIR': 'Jammu and Kashmir',
    'JAMMU & KASHMIR': 'Jammu and Kashmir',
    'JHARKHAND': 'Jharkhand',
    'KARNATAKA': 'Karnataka',
    'KERALA': 'Kerala',
    'LADAKH': 'Ladakh',
    'LAKSHADWEEP': 'Lakshadweep',
    'MADHYA PRADESH': 'Madhya Pradesh',
    'MAHARASHTRA': 'Maharashtra',
    'MANIPUR': 'Manipur',
    'MEGHALAYA': 'Meghalaya',
    'MIZORAM': 'Mizoram',
    'NAGALAND': 'Nagaland',
    'ODISHA': 'Odisha',
    'ORISSA': 'Odisha',
    'PONDICHERRY': 'Puducherry',
    'PUDUCHERRY': 'Puducherry',
    'PUNJAB': 'Punjab',
    'RAJASTHAN': 'Rajasthan',
    'SIKKIM': 'Sikkim',
    'TAMIL NADU': 'Tamil Nadu',
    'TAMILNADU': 'Tamil Nadu',
    'TELANGANA': 'Telangana',
    'TRIPURA': 'Tripura',
    'UTTAR PRADESH': 'Uttar Pradesh',
    'UTTARAKHAND': 'Uttarakhand',
    'UTTARANCHAL': 'Uttarakhand',
    'WEST BENGAL': 'West Bengal',
}

BAD_VALUES = {'', 'NA', 'N/A', 'NULL', 'NONE', '-'}

# words kept lowercase inside title-cased names
LOWER_WORDS = {'and', 'of', 'the'}


def title_case(name: str) -> str:
    name = re.sub(r'\s+', ' ', name.strip())
    words = []
    for i, w in enumerate(name.split(' ')):
        lw = w.lower()
        if i > 0 and lw in LOWER_WORDS:
            words.append(lw)
        elif len(w) <= 3 and w.isupper() and '.' not in w and i > 0:
            # keep short all-caps tokens (e.g. district codes like "II", "SAS")
            words.append(w if re.fullmatch(r'[IVX]+', w) else w.capitalize())
        else:
            words.append('-'.join(p.capitalize() for p in lw.split('-')))
    return ' '.join(words)


def clean_city(city: str, state: str) -> str:
    # Delhi "districts" are compass zones (Central, South East, …) — useless
    # as a city name; the city is New Delhi.
    if state == 'Delhi':
        return 'New Delhi'
    # Administrative suffixes that hide the actual city name.
    city = re.sub(r'\s+Urban$', '', city)
    if city == 'Mumbai Suburban':
        return 'Mumbai'
    return city


def main():
    votes = defaultdict(Counter)  # pincode -> Counter[(city, state)]
    total = kept = 0
    skipped_pin = skipped_blank = skipped_state = 0
    unknown_states = Counter()

    files = sorted(glob.glob(RAW_GLOB))
    if not files:
        sys.exit(f'no input files match {RAW_GLOB}')

    for path in files:
        with open(path, newline='', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f)
            for row in reader:
                total += 1
                pin = (row.get('pincode') or '').strip()
                district = (row.get('district') or '').strip()
                state_raw = (row.get('statename') or '').strip().upper()

                if not re.fullmatch(r'[1-9]\d{5}', pin):
                    skipped_pin += 1
                    continue
                if district.upper() in BAD_VALUES or state_raw in BAD_VALUES:
                    skipped_blank += 1
                    continue
                state = STATE_CANONICAL.get(state_raw)
                if state is None:
                    unknown_states[state_raw] += 1
                    skipped_state += 1
                    continue

                votes[pin][(clean_city(title_case(district), state), state)] += 1
                kept += 1

    with open(OUT_PATH, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f, lineterminator='\n')
        writer.writerow(['pincode', 'city', 'state'])
        for pin in sorted(votes):
            (city, state), _ = votes[pin].most_common(1)[0]
            writer.writerow([pin, city, state])

    print(f'rows read      : {total}')
    print(f'rows kept      : {kept}')
    print(f'bad pincode    : {skipped_pin}')
    print(f'blank city/st  : {skipped_blank}')
    print(f'unknown state  : {skipped_state} {dict(unknown_states.most_common(5)) if unknown_states else ""}')
    print(f'unique pincodes: {len(votes)}')


if __name__ == '__main__':
    main()
